const {Octokit} = require('@octokit/rest');
const {WebClient} = require('@slack/web-api');

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// 프로젝트 참여자 목록 (GitHub username과 Slack user ID 매핑)
const teamMembers = {
    'nimkoes': 'U01KDH93CQY',
    'Duflow89': 'U06D6JSK211',
    'hei5enbug': 'U06FPS3ET6X',
    'ZeroDuck': 'U06DVGF98QG'
    // 필요한 만큼 추가
};

// 프로젝트 설정
const projectConfig = {
    owner: 'NeatCoderz', // organization login
    repo: 'ThoughtExpedition',
    projectNumber: 1     // confirmed ProjectV2 number
};

async function getProjectFields() {
    try {
        // 프로젝트 정보 가져오기
        const project = await octokit.graphql(`
      query($owner: String!, $number: Int!) {
        organization(login: $owner) {
          projectV2(number: $number) {
            id
            fields(first: 20) {
              nodes {
                ... on ProjectV2Field {
                  id
                  name
                  dataType
                }
                ... on ProjectV2IterationField {
                  id
                  name
                  configuration {
                    iterations {
                      id
                      title
                    }
                  }
                }
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `, {
            owner: projectConfig.owner,
            number: projectConfig.projectNumber
        });

        if (!project?.organization?.projectV2) {
            console.error('GraphQL 응답에 organization.projectV2가 없습니다');
            console.dir(project, {depth: null});
            throw new Error('Invalid GraphQL response structure');
        }
        return project.organization.projectV2.fields.nodes;
    } catch (error) {
        console.error('Error fetching project fields:', error);
        throw error;
    }
}

async function getIssuesInProject() {
    try {
        const project = await octokit.graphql(`
      query($owner: String!, $number: Int!) {
        organization(login: $owner) {
          projectV2(number: $number) {
            items(first: 100) {
              nodes {
                content {
                  ... on Issue {
                    id
                    number
                    title
                    url
                    labels(first: 20) {
                      nodes {
                        name
                      }
                    }
                  }
                }
                fieldValues(first: 20) {
                  nodes {
                    ... on ProjectV2ItemFieldTextValue {
                      text
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      optionId
                    }
                    ... on ProjectV2ItemFieldIterationValue {
                      iterationId
                    }
                  }
                }
              }
            }
          }
        }
      }
    `, {
            owner: projectConfig.owner,
            number: projectConfig.projectNumber
        });

        if (!project?.organization?.projectV2?.items?.nodes) {
            console.error('GraphQL 응답에 필요한 item 정보가 없습니다');
            console.dir(project, {depth: null});
            throw new Error('Invalid project item response');
        }
        return project.organization.projectV2.items.nodes
            .filter(item => item.content)
            .map(item => ({
                id: item.content.id,
                number: item.content.number,
                title: item.content.title,
                url: item.content.url,
                labels: item.content.labels?.nodes?.map(label => label.name) || [],
                fieldValues: item.fieldValues.nodes
            }));
    } catch (error) {
        console.error('Error fetching issues in project:', error);
        throw error;
    }
}

async function checkIssues() {
    try {
        const debugMode = process.env.DEBUG_MODE === 'true';

        if (debugMode) {
            console.log('Debug mode enabled');
            console.log('Target issue: All issues');
        }

        // 프로젝트 필드 정보 가져오기
        const fields = await getProjectFields();
        const statusField = fields.find(field =>
            field.name.toLowerCase() === 'status' ||
            field.name.toLowerCase() === 'state'
        );

        if (!statusField) {
            console.error('Status field not found in project');
            return;
        }

        if (debugMode) {
            console.log('Found status field:', statusField);
        }

        // 프로젝트의 이슈들 가져오기
        const issues = await getIssuesInProject();

        if (debugMode) {
            console.log('All issues from project:');
            issues.forEach(issue => {
                console.log(`#${issue.number}: ${issue.title}`);
                console.log('- Labels:', issue.labels);
            });
        }

        // In Progress 상태의 이슈만 필터링
        const inProgressIssues = issues.filter(issue => {
            const statusValue = issue.fieldValues.find(value =>
                    value.optionId === statusField.options.find(opt =>
                        opt.name.toLowerCase() === 'in progress'
                    )?.id
            );
            return statusValue !== undefined;
        });

        // 특정 이슈만 필터링
        if (debugMode) {
            console.log(`Found ${inProgressIssues.length} issues in In Progress state`);
        }

        // 특정 이슈가 정확히 하나인지 확인
        if (inProgressIssues.length !== 1) {
            throw new Error(`Expected exactly one In Progress issue, found ${inProgressIssues.length}`);
        }
        const issue = inProgressIssues[0];


        const issueLabels = issue.labels;
        const unlabeledMembers = Object.keys(teamMembers).filter(
            member => !issueLabels.includes(member)
        );

        if (debugMode) {
            console.log(`Issue #${issue.number}:`);
            console.log('- Labels:', issueLabels);
            console.log('- Unlabeled members:', unlabeledMembers);
        }

        if (unlabeledMembers.length > 0) {
            const mentions = unlabeledMembers
                .map(member => `<@${teamMembers[member]}>`)
                .join(' ');

            await slack.chat.postMessage({
                channel: process.env.SLACK_CHANNEL_ID,
                text: `🚨 *미완료 알림*\n이슈 #${issue.number}: ${issue.title}\n${mentions}\n여러분의 생각을 기다리고 있습니다.\n${issue.url}`
            });
        } else {
            const mentions = issueLabels
                .map(member => `<@${teamMembers[member]}>`)
                .join(' ');

            await slack.chat.postMessage({
                channel: process.env.SLACK_CHANNEL_ID,
                text: `🚨 *피드백 요청*\n이슈 #${issue.number}: ${issue.title}\n${mentions}\n모든 분이 의견을 공유해주셨습니다.\n이제 서로의 생각에 피드백을 주고받으며 더 깊이 있는 논의를 이어가 주세요!\n${issue.url}`
            });
        }
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkIssues();

module.exports = {
    checkIssues,
    getIssuesInProject
};
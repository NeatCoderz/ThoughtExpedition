const { Octokit } = require('@octokit/rest');
const { WebClient } = require('@slack/web-api');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// 프로젝트 참여자 목록 (GitHub username과 Slack user ID 매핑)
const teamMembers = {
  'nimkoes': 'U01KDH93CQY',
  'username2': 'SLACK_USER_ID_2',
  // 필요한 만큼 추가
};

// 프로젝트 설정
const projectConfig = {
  owner: 'NeatCoderz',
  projectNumber: 1
};

async function getProjectFields() {
  try {
    // 프로젝트 정보 가져오기
    const { data: project } = await octokit.graphql(`
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

    return project.organization.projectV2.fields.nodes;
  } catch (error) {
    console.error('Error fetching project fields:', error);
    throw error;
  }
}

async function getIssuesInProject() {
  try {
    const { data: project } = await octokit.graphql(`
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
        }
      }
    `, {
      owner: projectConfig.owner,
      number: projectConfig.projectNumber
    });

    return project.organization.projectV2.items.nodes
      .filter(item => item.content)
      .map(item => ({
        id: item.content.id,
        number: item.content.number,
        title: item.content.title,
        url: item.content.url,
        labels: item.content.labels.nodes.map(label => label.name),
        fieldValues: item.content.fieldValues.nodes
      }));
  } catch (error) {
    console.error('Error fetching issues in project:', error);
    throw error;
  }
}

async function checkIssues() {
  try {
    const debugMode = process.env.DEBUG_MODE === 'true';
    const targetIssue = process.env.TARGET_ISSUE;

    if (debugMode) {
      console.log('Debug mode enabled');
      console.log('Target issue:', targetIssue || 'All issues');
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
    const targetIssues = targetIssue 
      ? inProgressIssues.filter(issue => issue.number.toString() === targetIssue)
      : inProgressIssues;

    if (debugMode) {
      console.log(`Found ${targetIssues.length} issues in In Progress state`);
    }

    for (const issue of targetIssues) {
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
          text: `🚨 *독서 미완료 알림*\n이슈 #${issue.number}: ${issue.title}\n독서 완료 라벨이 누락되었습니다: ${mentions}\n${issue.url}`
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkIssues(); 
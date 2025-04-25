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
  repo: 'ThoughtExpedition',
  projectNumber: 1, // 프로젝트 번호 (URL에서 확인 가능)
  inProgressColumnId: 'in_progress_column_id' // In Progress 컬럼의 ID
};

async function getProjectColumns() {
  try {
    // 프로젝트 정보 가져오기
    const { data: project } = await octokit.graphql(`
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          projectV2(number: $number) {
            id
            columns(first: 20) {
              nodes {
                id
                name
              }
            }
          }
        }
      }
    `, {
      owner: projectConfig.owner,
      repo: projectConfig.repo,
      number: projectConfig.projectNumber
    });

    return project.repository.projectV2.columns.nodes;
  } catch (error) {
    console.error('Error fetching project columns:', error);
    throw error;
  }
}

async function getIssuesInColumn(columnId) {
  try {
    const { data: column } = await octokit.graphql(`
      query($columnId: ID!) {
        node(id: $columnId) {
          ... on ProjectV2Column {
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
              }
            }
          }
        }
      }
    `, {
      columnId: columnId
    });

    return column.node.items.nodes
      .filter(item => item.content)
      .map(item => ({
        id: item.content.id,
        number: item.content.number,
        title: item.content.title,
        url: item.content.url,
        labels: item.content.labels.nodes.map(label => label.name)
      }));
  } catch (error) {
    console.error('Error fetching issues in column:', error);
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

    // 프로젝트 컬럼 정보 가져오기
    const columns = await getProjectColumns();
    const inProgressColumn = columns.find(col => col.name.toLowerCase() === 'in progress');
    
    if (!inProgressColumn) {
      console.error('In Progress column not found');
      return;
    }

    if (debugMode) {
      console.log('Found In Progress column:', inProgressColumn);
    }

    // In Progress 컬럼의 이슈들 가져오기
    const issues = await getIssuesInColumn(inProgressColumn.id);

    // 특정 이슈만 필터링
    const targetIssues = targetIssue 
      ? issues.filter(issue => issue.number.toString() === targetIssue)
      : issues;

    if (debugMode) {
      console.log(`Found ${targetIssues.length} issues in In Progress column`);
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
          text: `🚨 *라벨 누락 알림*\n이슈 #${issue.number}: ${issue.title}\n다음 멤버들의 라벨이 누락되었습니다: ${mentions}\n${issue.url}`
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkIssues(); 
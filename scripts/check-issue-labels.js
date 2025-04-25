const { Octokit } = require('@octokit/rest');
const { WebClient } = require('@slack/web-api');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// 프로젝트 참여자 목록 (GitHub username과 Slack user ID 매핑)
const teamMembers = {
  'username1': 'SLACK_USER_ID_1',
  'username2': 'SLACK_USER_ID_2',
  // 필요한 만큼 추가
};

async function checkIssues() {
  try {
    const debugMode = process.env.DEBUG_MODE === 'true';
    const targetIssue = process.env.TARGET_ISSUE;

    if (debugMode) {
      console.log('Debug mode enabled');
      console.log('Target issue:', targetIssue || 'All issues');
    }

    // 이슈 목록 가져오기
    const { data: issues } = await octokit.issues.listForRepo({
      owner: 'NeatCoderz',
      repo: 'ThoughtExpedition',
      state: 'open'
    });

    // 특정 이슈만 필터링
    const targetIssues = targetIssue 
      ? issues.filter(issue => issue.number.toString() === targetIssue)
      : issues;

    if (debugMode) {
      console.log(`Found ${targetIssues.length} issues to check`);
    }

    for (const issue of targetIssues) {
      const issueLabels = issue.labels.map(label => label.name);
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
          text: `🚨 *라벨 누락 알림*\n이슈 #${issue.number}: ${issue.title}\n다음 멤버들의 라벨이 누락되었습니다: ${mentions}\n${issue.html_url}`
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkIssues(); 
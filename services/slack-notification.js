import { default as axios } from "axios";

export const processSlackNotification = async (stalePRs = []) => {
  if (Array.isArray(stalePRs) && stalePRs.length > 0) {
    while (stalePRs.length > 0) {
      const processPRs = stalePRs.splice(0, 10);
      await Promise.all(
        processPRs.map(({ user = "", pullTitle = "", lastUpdateAt = "", pullURL = "" }) => {
          const payload = {
            blocks: [
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: `Stale Pull Request on repo: ${process.env.GITHUB_REPOSITORY}`,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `>*Owner:* ${user} \n>*Pull title:* ${pullTitle}\n>*Last updated at:* ${lastUpdateAt}`,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `<${pullURL}|View pull request>`,
                },
              },
            ],
          };
          return notifySlack(pullURL, payload);
        })
      );
    }
  }
};

const notifySlack = async (pullURL, payload) => {
  try {
    const res = await axios.post(`${process.env.INPUT_SLACK_WEB_HOOK}`, payload);
    console.log(`Pull request ${pullURL} processed sucessfully`);
    return res.data;
  } catch (error) {
    console.error(`Pull request ${pullURL} processed with error ${error.message}`);
    throw error;
  }
};
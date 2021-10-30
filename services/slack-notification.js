import { default as axios } from "axios";

export const processSlackNotification = async (staleBranches = []) => {
  if (Array.isArray(staleBranches) && staleBranches.length > 0) {
    const userStaleBranchMap = new Map();
    for (const staleBranch of staleBranches) {
      const { user, ...data } = staleBranch;
      const branches = userStaleBranchMap.get(user) || [];
      userStaleBranchMap.set(user, [...branches, data]);
    }

    for (const [user, branches] of userStaleBranchMap) {
      //processing 15 branches at a time as a bigger payload than this throws 400 from slack webhook
      for (let index = 0; index < branches.length; index=index + 15) { 
        const processedBranches = branches.slice(index, index + 15); 
        let payload = {};
        if (index === 0) {
          payload = {
            blocks: [
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: `Stale Branch on repo: ${process.env.GITHUB_REPOSITORY}`,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*${user}* has ${branches.length} stale branch${branches.length > 1 ? "es" : ""}`,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: processedBranches
                    .map(
                      ({ branchName, branchURL, lastUpdateAt }) =>
                        branchTemplate`>*Branch:* ${branchName} \n>*Last updated at:* ${lastUpdateAt}\n><${branchURL}|View branch>`
                    )
                    .join("\n"),
                },
              },
            ],
          };
        } else {
          payload = {
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: processedBranches
                    .map(
                      ({ branchName, branchURL, lastUpdateAt }) =>
                        branchTemplate`>*Branch:* ${branchName} \n>*Last updated at:* ${lastUpdateAt}\n><${branchURL}|View branch>`
                    )
                    .join("\n"),
                },
              },
            ],
          };
        }
        await notifySlack(user, payload);
      }
    }
  }
};

const branchTemplate = (strings, ...values) => {
  let result = [strings[0]];
  values.forEach(function (value, i) {
    result.push(value, strings[i + 1]);
  });
  return result.join("");
};

const notifySlack = async (user, payload) => {
  try {
    const res = await axios.post(`${process.env.SLACK_WEB_HOOK}`, payload);
    console.log(`Pull request ${user} processed sucessfully`);
    return res.data;
  } catch (error) {
    console.error(`Pull request ${user} processed with error ${error.message}`);
    // throw error;
  }
};

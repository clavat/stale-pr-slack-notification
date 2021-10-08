import { processSlackNotification } from "./services/slack-notification.js";
import { pullStalePRs } from "./services/github.js";

const run = async () => {
  try {
    const stalePRs = await pullStalePRs(
      process.env.GITHUB_REPOSITORY,
      process.env.INPUT_REPO_TOKEN,
      process.env.INPUT_BASE_BRANCH,
      process.env.INPUT_STALE_LABEL
    );
    if (stalePRs && stalePRs.length > 0) {
      await processSlackNotification(stalePRs);
    } else {
      console.log("No stale Pull requests to process");
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

run();

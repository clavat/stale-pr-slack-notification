import { processSlackNotification } from "./services/slack-notification.js";
import { fetchStaleBranches } from "./services/github.js";

const run = async () => {
  try {
    const staleBranches = await fetchStaleBranches(
      process.env.INPUT_BASE_BRANCH,
      process.env.MAX_BRANCH_CONCURRENCY,
      process.env.STALE_DAYS
    );
    if (staleBranches && staleBranches.length > 0) {
      await processSlackNotification(staleBranches);
    } else {
      console.log("No stale Pull requests to process");
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

run();

import { default as axios } from "axios";
import moment from "moment";

const GITHUB_API_URL = "https://api.github.com";

export const pullStalePRs = async (baseBranch, staleLabel = "stale") => {
  const queryParams = `q=is:pr repo:${process.env.GITHUB_REPOSITORY} state:open base:${baseBranch} label:${staleLabel}`;
  console.log("🚀 ~ file: index.js ~ line 8 ~ pullStalePRs ~ queryParams", queryParams);
  const res = await axios.get(`${GITHUB_API_URL}/search/issues?${queryParams}`, {
    headers: {
      Accept: "application/vnd.github.v3.raw+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  });

  const { items = [] } = res.data;
  return items.map(({ html_url = "", title = "", user: { login: user = "" } = {}, updated_at }) => ({
    pullURL: html_url,
    pullTitle: title,
    user,
    lastUpdateAt: moment(updated_at).format("MMM Do YYYY"),
  }));
};

export const fetchStaleBranches = async (baseBranch, branchesPerPage = 10, staleDays = 30) => {
  const staleBranches = [];
  for await (const branches of fetchBranches(baseBranch, branchesPerPage)) {
    if (branches && Array.isArray(branches) && branches.length > 0) {
      const processedBranches = await processBranches(branches, process.env.GITHUB_REPOSITORY, baseBranch, staleDays);
      staleBranches.push(...processedBranches);
    }
  }

  return staleBranches;
};

async function* fetchBranches(baseBranch, branchesPerPage) {
  let page = 1;
  while (true) {
    let queryParams = `per_page=${branchesPerPage}&page=${page}`;
    const res = await axios.get(`${GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/branches?${queryParams}`, {
      headers: {
        Accept: "application/vnd.github.v3.raw+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    });

    const branches = res.data || [];
    const resArray = await Promise.all(
      branches.filter(({ name }) => name != baseBranch).map(({ name }) => fetchBranch(name))
    );
    yield resArray.map((res) => res.data);

    if (branches && branches.length < branchesPerPage) {
      return;
    }
    page++;
  }
}

const fetchBranch = async (branchName) =>
  axios.get(`${GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/branches/${branchName}`, {
    headers: {
      Accept: "application/vnd.github.v3.raw+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  });

const fetchBranchesPullRequest = async (branch, baseBranch) => {
  if (!branch || !baseBranch) {
    throw new Error("Insufficitent parameters");
  }

  const queryParams = `state=closed&base=${baseBranch}&head=${branch}&per_page=1`;
  return axios.get(`${GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/pulls?${queryParams}`, {
    headers: {
      Accept: "application/vnd.github.v3.raw+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  });
};

const processBranches = async (branches, repository = "", baseBranch = "main", staleDays = 30) => {
  const user = repository.split("/")[0];
  if (branches && branches.length > 0) {
    const pullReqs = await Promise.all(
      branches.map((branch) => fetchBranchesPullRequest(`${user}:${branch.name}`, baseBranch))
    );

    return branches
      .filter((branch, index) => {
        const { commit: { sha, commit: { author: { date } = {} } = {} } = {} } = branch;
        // const index = 1;
        const pullReqRes = pullReqs[index];
        if (pullReqRes && pullReqRes.data && Array.isArray(pullReqRes.data) && pullReqRes.data.length > 0) {
          const { data: [pullReq] = [] } = pullReqRes;
          const {
            merged_at,
            head: { sha: headSha },
          } = pullReq;
          if (merged_at) {
            if (sha === headSha) {
              return false;
            }
          }
        }

        if (moment().diff(moment(date), "days") > staleDays) {
          return true;
        }
      })
      .map((branch) => {
        const {
          name,
          commit: { commit: { author: { date, name: commitUser } = {} } = {}, author } = {},
          _links: { html } = {},
        } = branch;

        const user = author && author.login ? author.login : commitUser; // setting the user to the author name of the commit if author of the branch is null
        return {
          branchURL: html,
          branchName: name,
          user,
          lastUpdateAt: moment(date).format("MMM Do YYYY"),
        };
      });
  }
  return [];
};

import { default as axios } from "axios";
import moment from "moment";

export const pullStalePRs = async (repo, token, baseBranch, staleLabel = "stale") => {
  const queryParams = `q=is:pr repo:${repo} state:open base:${baseBranch} label:${staleLabel}`;
  console.log("🚀 ~ file: index.js ~ line 8 ~ pullStalePRs ~ queryParams", queryParams);
  const res = await axios.get(`https://api.github.com/search/issues?${queryParams}`, {
    headers: {
      Accept: "application/vnd.github.v3.raw+json",
      Authorization: `Bearer ${token}`,
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
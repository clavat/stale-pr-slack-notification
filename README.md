# Send Slack notification for PR marked stale

Sends slack notifcation to the slack web-hook provided for all PR marked with label stale  

## Recommended permissions

For the execution of this action, it must be able to fetch all pull requests from your repository.  
This can be achieved with the following [configuration in the action](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#permissions) if the permissions are restricted:

```yaml
permissions:
  pull-requests: read
```

## ENV variables

### GITHUB_TOKEN  

**required** The github token used to fetch pull requests.

### SLACK_WEB_HOOK  

**required** Slack web hook.

## Inputs

### base_branch

**optional** The base brach of the PR. Default `main`

### branch_concurrency

**optional** The number of branches API fetch will be done concurrently. Default `50`

### stale_days

***optional** The number of days since the last update on a branch. Default `30`

## Example  

```yaml
- name: Notify Stale Issues
        uses: clavat/stale-pr-slack-notification@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SLACK_WEB_HOOK: ${{ secrets.SLACK_WEB_HOOK }}
        with:
          stale_label: stale
          base_branch: main
```

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- AI chat streams from the /api/chat server route (gateway helpers in src/server/ai); all feature tabs feed prompts into the one shared chat so AI logic lives in one place.
- Chat, earnings and preferences persist in browser localStorage only; no backend accounts, to keep the demo login-free.

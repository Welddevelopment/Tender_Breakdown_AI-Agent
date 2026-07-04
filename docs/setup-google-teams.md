# Setup — Google sign-in + teams

Everything below is optional configuration. With none of it set, Bidframe runs exactly as
before (email/password auth, per-tender sharing); the Google button hides and teams still
work between existing accounts.

## 1. Google sign-in (one-time, Google Cloud Console)

1. Go to **console.cloud.google.com** → create/select a project.
2. **APIs & Services → OAuth consent screen** → configure (External is fine; add your email
   as a test user while unverified).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins:** every origin the button loads on — e.g.
     `http://localhost:3000` and your Vercel URL(s).
   - Create, then copy the **Client ID** (looks like `…apps.googleusercontent.com`).
4. Put that same client ID in **both** places:
   - Backend: `GOOGLE_CLIENT_ID=…` (Render dashboard env, or `backend/.env`).
   - Frontend: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=…` (Vercel env, or `frontend/.env.local`).

That's it — the "Sign in with Google" button appears on `/login`. The backend verifies each
Google ID token against this client ID before issuing a Bidframe session.

### Invite-only vs. open onboarding

By default a first-time Google email **auto-creates** an account (the easy way to onboard
teammates: they sign in with Google, then a team owner adds them by email). To keep the strict
invite-only posture instead, set `GOOGLE_AUTO_PROVISION=0` on the backend — then only emails that
already have an account (created via `python -m app.admin create-user`) can sign in with Google.

## 2. Teams

No setup — teams are a product feature:

1. Sign in, open **Teams** in the app header.
2. **Create** a team, then **add teammates by email** (they need a Bidframe account first —
   signing in with Google creates one).
3. Open any tender → **Share** → **share with a team**. Everyone on the team can now open it,
   decide on requirements (attributed to them), and comment.

## 3. Realtime + comments

No setup. When the frontend talks to the live backend (`NEXT_PUBLIC_API_BASE_URL` set), the
tender view subscribes to a Server-Sent Events stream: a teammate's decision or comment appears
live. This is in-memory on a single backend instance (the Render free tier); a multi-instance
deploy would back the pub/sub with Redis (see `backend/app/events.py`).

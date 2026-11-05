# Milestone 3 — Core Functionality Development

**Project:** XU ThriftExchange — ITCC 41-A  
**Members:** Andrei Nacaya, Dann Roa, Denz Macasero  
**Status:** Feature branches and a dedicated `staging` integration branch are prepared. Actual feature implementation and team contributions are pending. The `main` branch is reserved for approved, stable releases.

## Milestone goal

Turn the Milestone 2 user interface into a working campus marketplace with real authorization, data persistence and retrieval, functional listings, search, and reservations. The approved project covers second-hand academic materials and seller contact through Facebook or phone. In-app chat, integrated payment and delivery are outside this milestone.

## Feature assignments

| Owner | Feature branch | Acceptance evidence |
| --- | --- | --- |
| **Andrei** | `feature/andrei-firebase-setup` | Firebase project configuration; Firestore data model; relevant security rules; demonstrated creation and retrieval of test data; no credentials committed. |
| **Andrei** | `feature/andrei-google-login` | Supported university identity sign-in; account eligibility checks; preserved session and sign-out; demonstration of valid/invalid user flows. Confirm Xavier's approved identity provider and exact eligible account domains first. |
| **Dann** | `feature/dann-item-listings` | Actual add-item form processing, validation, uploaded image storage, item record creation, seller Facebook or phone contact, and cross-device retrieval. |
| **Dann** | `feature/dann-item-status` | Listing owner can update own item availability (Available / Reserved / Sold). Other accounts cannot alter another person's items. Align statuses with the reservation logic. |
| **Denz** | `feature/denz-search-filter` | Real database query and visible search/filter results for title, academic category, department/course and availability, including empty/error states. |
| **Denz** | `feature/denz-reservations` | Real reservation requests, persisted status changes, conflicting reservation handling, confirmation and seller contact handoff. Use an atomic/transactional reservation operation. |

Each feature must have its **own branch and its own Pull Request into `staging`**. Authors must perform and commit their own actual work using their own GitHub accounts.

## Branching strategy (Milestone 3)

```text
feature/andrei-*  ── PR ──┐
feature/dann-*    ── PR ──┼──> staging ── integration tests ── reviewed release PR ──> main
feature/denz-*    ── PR ──┘
```

- **`main`: stable baseline.** Do not push directly or merge incomplete features. Leave it unchanged throughout development/testing until the group approves a tested release.
- **`staging`: shared testing/integration.** Every feature PR targets `staging`. Resolve conflicts and run end-to-end tests here.
- **`feature/<member>-<feature>`: individual contributions.** Each member commits using their own GitHub account and opens a distinct PR with tests/screenshots.
- **Release:** Only after all agreed features pass staging checks, open a **separate** PR from `staging` to `main` for approval. Do not merge it automatically.

For stricter enforcement, the repository administrator should enable branch protection/rules for `main` (require PR review, block direct pushes). This document establishes the process but does not itself enforce GitHub permissions.

## Recommended build order

1. Andrei completes **Firebase setup** and opens PR; test and merge into `staging`.
2. Teammates update their feature branches from `staging` before editing code and agree on shared data fields and API boundaries.
3. Dann completes **Item Listings**; Denz can develop **Search / Filter** against the agreed schema, then connect to real listing data.
4. Dann implements listing ownership/status; Denz implements reservation transactions, coordinating item-status rules.
5. Andrei completes supported campus Google/identity sign-in. Once merged, verify backend security rules using actual user identities.
6. Integrate and run buyer/seller demos end-to-end on supported devices.

**Dependency note:** A new feature branch may initially point to the same commit as `main`. The branch itself is not evidence of completed work; meaningful code commits and reviewed PRs are.

## Contributor workflow

Use your own GitHub account to clone, make changes, commit, push, and open a PR from your assigned feature branch to **`staging`**.

```bash
git clone https://github.com/1erdna/XUThriftExchange.git
cd XUThriftExchange
git fetch origin
git switch feature/andrei-firebase-setup  # Replace with your own assigned branch
# Before editing, incorporate the current staging baseline, e.g.:
git merge origin/staging
# Make and test your changes
git add .
git commit -m "feat(firebase): set up secure data access"
git push -u origin HEAD
```

Then open **Pull requests → New pull request** on GitHub. Select **`base: staging`** and **`compare: <your feature branch>`**. In the PR description, provide:

- What the feature changes and why it solves the approved problem
- Screenshots or short video of its **actual behavior**
- Test steps and their results
- Issues or remaining limitations
- Contributor name and linked feature branch

**Do not commit** API secrets, service-account keys, keystores, passwords, `node_modules/`, `platforms/`, or unneeded generated files.

## Required Milestone 3 submission

1. Updated working application.
2. Demonstration of implemented core features.
3. Updated GitHub source repository with separate authored commits and feature PRs.
4. Progress report covering **completed features, features currently being developed, remaining features, problems encountered, and solutions implemented**.

### Evidence checklist for instructor review

- [ ] Branch names correspond to specific features and responsible team members
- [ ] Each member's own commits are visible on GitHub
- [ ] Separate feature pull requests target `staging` and show changed code, testing and review
- [ ] No direct feature merges or pushes into `main` before release approval
- [ ] Implemented features work with data beyond a single browser-local demo
- [ ] Application demonstrates core workflow: sign in → post item → search → reserve → see updated status
- [ ] Progress report accurately distinguishes completed functionality from work still pending

This document is an **assignment plan**, not a claim that Milestone 3 code has been implemented.

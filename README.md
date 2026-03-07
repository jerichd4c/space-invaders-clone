# 👾 Space Invaders Clone - Web Development 1 Project

This project is a clone of the classic arcade game *Space Invaders*, developed in pairs as part of the Web Development 1 course. The game is built from scratch using standard web technologies (Vanilla) without any additional frameworks.

## 🛠️ Technologies Used
* **HTML5:** Structure and game container (`<canvas>` or DOM).
* **CSS3:** Interface styles, menus, and retro typography.
* **JavaScript (ES6+):** Game logic, OOP (Object-Oriented Programming), physics, collisions, and the *Game Loop*.

## ✨ Key Features (Checklist)
* Fluid player ship movement and firing mechanics.
* Alien horde with block movement and progressive descent.
* **Sprite Animation:** Enemies feature a constantly looping animation (**idle animation**) to maintain the classic arcade feel.
* Collision detection system (Hitboxes).
* Score and lives system.
* Game states: Start, Game Over, and Victory screens.

## 🚀 How to Run the Project Locally
1. Clone this repository to your local machine:
   `git clone <repository-url>`
2. Open the project folder in your code editor (e.g., VS Code).
3. Open the `index.html` file directly in your web browser, or use an extension like *Live Server* for automatic hot-reloading.

---

## 🤝 Collaboration Guide (Workflow)

To ensure a smooth and organized development process, both team members must adhere to the following rules:

### 🌿 Branching Strategy
* The `main` (or `dev`) branch will always contain the functional and stable code. **Never work directly on this branch.**
* Each contributor must create their own dedicated branch for any new feature, bug fix, or enhancement they are working on.
* **Branch Naming:** Names must follow the format `yourName-feature`.
  * *Examples:* `maria-player-movement`, `carlos-alien-animation`, `maria-fix-collisions`.

### 📝 Conventional Commits
All commit messages must follow a clear convention. This helps in understanding the change history at a glance:
* `feat:` For a new feature (e.g., `feat: add scoring system`).
* `fix:` To resolve a bug (e.g., `fix: resolve issue where ship leaves screen`).
* `docs:` For documentation or README updates (e.g., `docs: update installation instructions`).
* `style:` For CSS or code formatting changes (e.g., `style: center Game Over title`).
* `refactor:` For code restructuring without adding features or fixing bugs (e.g., `refactor: optimize game loop function`).

### 🔄 Pull Requests (PRs)
1. Once your feature is complete and tested on your local branch, push to GitHub and open a **Pull Request (PR)** to the main branch (`main` or `dev`).
2. Provide a clear and concise description of the changes made in the PR.
3. Once approved, the merge is performed and the feature branch can be deleted.

---
*Project developed with ☕ and 💻 for Web Development 1.*
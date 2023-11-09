Required Software:

1. npm (https://nodejs.org/en/download)
2. Visual Studio Code (https://code.visualstudio.com/)

Project Launch Instructions:

1. From the terminal, within the main project directory, execute:
	1. npm install
	2. npm run dev
2. You will be notified of the local port where the project will launch. Input this address into a browser, e.g.:
	1. http://localhost:8080/
3. In the browser, a scene should open displaying a building's roof, our protagonist, and an enemy with a looped walking animation.
4. The character can be controlled using the W, S, A, D keys on the keyboard.

Visual Studio Code:

1. It's best to open the main project directory in Visual Studio Code.
2. Most of the task will be done in the file Enemy.ts, located at the path src/client/game/characters/Enemies/Enemy.ts.

Task Details:

1. The enemy should move.
2. The enemy should have its own triangular field of vision. The enemy's field of view is 60 degrees.
	1. Display the enemy's field of vision using straight lines or a transparent triangle. By default, the field of vision should be green.
3. If the player is within the enemy's field of view, then:
	1. The color of the field of view turns red.
	2. The enemy should start moving towards the player.
4. If the player leaves the enemy's field of view, then:
	1. The field of view should turn back to green.
	2. The enemy should stop.
5. We should be able to escape from the enemy's field of view.
6. The last part of the task is to add a second enemy, who will behave the same way, but will have a different starting position.
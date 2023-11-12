This is task notes by candidate Uğur Cengiz.



Project Launch Instructions:

1. In the root folder of project run commands below to open project
- npm install
- npm run dev



| --- About task matters --- |

**** The enemy should move. *****
- I inspected whole project first, tried to understand structure behind. Then in Player.ts file i saw how to move characters and used functions from there
More notes in git commits.

*****
2. The enemy should have its own triangular field of vision. The enemy's field of view is 60 degrees.
	1. Display the enemy's field of vision using straight lines or a transparent triangle. By default, the field of vision should be green.
3. If the player is within the enemy's field of view, then:
	1. The color of the field of view turns red.
	2. The enemy should start moving towards the player.
4. If the player leaves the enemy's field of view, then:
	1. The field of view should turn back to green.
	2. The enemy should stop.
*****

- I could't handle creating 60degrees triange that attached infront of enemy. Because i only worked with this technology 3,4 days.
There was crutial shortcomings that i know what they are. I find important that i know what i need to know. However i did my best to getting close to do tasks.

Instead i created a sphere and collider into it. 
When player collides this, sphere turns to red and enemy starts chasing after player. He rotates and looks at player.
Player is faster than enemy so if player is far enough from enemy, enemies stop chasing after max-limit distance. 

***
6. The last part of the task is to add a second enemy, who will behave the same way, but will have a different starting position.

- I instantiated one more enemy but different position to spawn.

# Overview

A Pokedex app inspired by Pokemon Emerald (https://youtu.be/VUu3mGuN9S0?t=10). The Pokedex consists of two containers, one for the images and another for the names. The Pokemon data is retrieved from PokeAPI via the Fetch API and rendered using the Document Object Model.

Navigation controls have also been added to replicate the controls in the original game, and in addition the user can scroll the containers using keyboard navigation or a scroll wheel. This functionality was made possible with Aleksandr Hovhannisyan's guide on creating accessible image carousels (https://www.aleksandrhovhannisyan.com/blog/image-carousel-tutorial/). The user can scroll both containers simultaneously, a feature I was able to implement with the help of this post on Stack Overflow by Artem Kachanovskyi: https://stackoverflow.com/questions/9236314/how-do-i-synchronize-the-scroll-position-of-two-divs.

The scrollbar has been styled using the SimpleBar library https://github.com/Grsmto/simplebar.

The app also comes with a loading animation and is responsive.

![Pokedex Desktop](./pokedex-desktop.png)
![Pokedex Tablet](./pokedex-tablet.png)
![Pokedex Mobile](./pokedex-mobile.png)

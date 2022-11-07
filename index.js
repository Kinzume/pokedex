// Add Pokedex navigation controls
const pokedex = document.querySelector(".pokedex");

const controls = document.createElement("ol");
controls.setAttribute("role", "list");
controls.classList.add("pokedex-controls");
controls.setAttribute("aria-label", "Navigation controls");
/**
 * Returns the distance from the starting edge of the viewport to the given focal point on the element.
 * @param {HTMLElement} element
 * @param {'start'|'center'|'end'} [focalPoint]
 */
const getDistanceToFocalPoint = (element, focalPoint = "center") => {
  const rect = element.getBoundingClientRect();
  switch (focalPoint) {
    case "start":
      return rect.top;
    case "end":
      return rect.bottom;
    case "center":
    default:
      return rect.top + rect.height / 2;
  }
};
/**
 * @param {'start'|'end'} direction
 */
const createNavButton = (direction) => {
  const li = document.createElement("li");
  const button = document.createElement("button");
  button.classList.add(
    "pokedex-control",
    direction,
    "triangle",
    direction === "start" ? "up" : "down"
  );
  button.ariaLabel = direction === "start" ? "Previous" : "Next";
  button.addEventListener("click", () => navigateToNextItem(direction));
  li.appendChild(button);
  controls.appendChild(li);
  return button;
};
/**
 * @param {'start'|'end'} direction
 */
function navigateToNextItem(direction) {
  const imagesScrollContainer = document.querySelector(
    '[class="images-scroll-container scroll-snap"]'
  );
  const imageList = imagesScrollContainer.querySelector('[role="list"]');
  let mediaItems = Array.from(imageList.querySelectorAll(":scope > *"));
  mediaItems = direction === "start" ? mediaItems.reverse() : mediaItems;
  const scrollContainerCenter = getDistanceToFocalPoint(
    imagesScrollContainer,
    "center"
  );
  let targetFocalPoint;
  for (const mediaItem of mediaItems) {
    let focalPoint = window.getComputedStyle(mediaItem).scrollSnapAlign;
    if (focalPoint === "none") {
      focalPoint = "center";
    }
    const distanceToItem = getDistanceToFocalPoint(mediaItem, focalPoint);
    // The 1s are to account for off-by-one errors. Sometimes, the currently centered
    // media item's center doesn't match the pokedex's center and is off by one.
    if (
      (direction === "start" && distanceToItem + 1 < scrollContainerCenter) ||
      (direction === "end" && distanceToItem - scrollContainerCenter > 1)
    ) {
      targetFocalPoint = distanceToItem;
      break;
    }
  }
  // This should never happen, but it doesn't hurt to check
  if (typeof targetFocalPoint === "undefined") return;
  const scrollAmount = targetFocalPoint - scrollContainerCenter;
  imagesScrollContainer.scrollBy({
    top: scrollAmount,
    behavior: "smooth",
  });
}
const navControlPrevious = createNavButton("start");
const navControlNext = createNavButton("end");
pokedex.appendChild(controls);

const imagesScrollContainer = document.querySelector(
  '[class="images-scroll-container"]'
);
const imageList = imagesScrollContainer.querySelector('[role="list"]');
const namesScrollContainer = document.querySelector(
  '[class="names-scroll-container"]'
);
const namesList = namesScrollContainer.querySelector('[role="list"]');

/**
 * Returns a string with leading zeroes of the given number.
 * @param {number} entryNumber
 */
function addLeadingZeroes(entryNumber) {
  return ("000" + entryNumber).slice(-3);
}

function _handlePokedexScroll() {
  const imagesScrollTop = Math.abs(imagesScrollContainer.scrollTop);
  // off-by-one correction for Chrome, where clientHeight is sometimes rounded down
  const imagesHeight = imagesScrollContainer.clientHeight + 1;
  const isAtStart = Math.floor(imagesScrollTop) <= 100;
  const isAtEnd =
    Math.ceil(imagesHeight + imagesScrollTop + 100) >=
    imagesScrollContainer.scrollHeight;
  navControlPrevious.setAttribute("aria-disabled", isAtStart);
  navControlNext.setAttribute("aria-disabled", isAtEnd);
}
imagesScrollContainer.addEventListener("scroll", () => {
  _handlePokedexScroll();
});

const renderImages = (data) => {
  const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/`;
  const ol = document.createElement("ol");
  ol.className = "images";
  ol.setAttribute("role", "list");
  data.forEach(({ name, id }) => {
    const li = document.createElement("li");
    li.className = "image-item";
    const img = new Image(150, 150);
    img.alt = name;
    img.src = imgUrl + `${id}.png`;
    li.appendChild(img);
    ol.append(li);
  });
  imagesScrollContainer.replaceChild(ol, imageList);
  const newImages = document.querySelectorAll('[class="image-item"]>img');
  const newImagesList = Array.from(newImages);
  newImagesList[newImagesList.length - 1].onload = () => {
    console.log("last image loaded");
    newImages.forEach((img) => img.removeAttribute("height"));
    const loader = document.querySelector('[class="loader"]');
    console.log(loader);
    loader.classList.add("loaded");
    addSyncScroll();
    _handlePokedexScroll();
    _rotatePokeball();
    setTimeout(() => {
      loader.style = "z-index:-999";
    }, 1200);
  };
};

const renderNames = (data) => {
  const ol = document.createElement("ol");
  ol.className = "names flow";
  ol.setAttribute("role", "list");
  data.forEach(({ name }, i) => {
    const li = document.createElement("li");
    li.className = "name-item";
    const span = document.createElement("span");
    span.className = "entry-number";
    span.setAttribute("aria-hidden", true);
    const miniPokeball = new Image();
    miniPokeball.alt = "mini pokeball";
    miniPokeball.src =
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
    span.append(miniPokeball);
    span.append("No" + addLeadingZeroes(i) + " ");
    const li_content = document.createTextNode(name.toUpperCase());
    li.appendChild(span);
    li.appendChild(li_content);
    ol.append(li);
  });
  namesScrollContainer
    .querySelector('[class="simplebar-content"]')
    .replaceChild(ol, namesList);
};

const pokeball = document.querySelector('[class="pokeball"]');
function _rotatePokeball() {
  const namesScrollContainer = SimpleBar.instances
    .get(document.querySelector("[data-simplebar]"))
    .getScrollElement();

  let leftScrollSync = false;
  let rightScrollSync = false;
  const leftCol = imagesScrollContainer;
  const rightCol = namesScrollContainer;
  leftCol.addEventListener("scroll", () => {
    if (!leftScrollSync) {
      rightScrollSync = true;
      const image = document.querySelector('[class="image-item"]');
      // a mod b = ((a % b) + b) % b
      const rotation = (leftCol.scrollTop / image.clientHeight) * 22.5;
      const a = rotation;
      const b = 360;
      const amodb = ((a % b) + b) % b;
      pokeball.style.transform = `scale(5) translate(-1em) rotate(${amodb}deg)`;
    }
    leftScrollSync = false;
  });
  rightCol.addEventListener("scroll", () => {
    if (!rightScrollSync) {
      leftScrollSync = true;
      const name = document.querySelector('[class="name-item"]');
      // a mod b = ((a % b) + b) % b
      // console.log(rightCol.scrollTop);
      const rotation = (rightCol.scrollTop / name.clientHeight) * 22.5;
      const a = rotation;
      const b = 360;
      const amodb = ((a % b) + b) % b;
      // console.log(amodb);
      pokeball.style.transform = `scale(5) translate(-1em) rotate(${amodb}deg)`;
    }
    rightScrollSync = false;
  });
}
function addSyncScroll() {
  // Allows the user to simultaneously scroll two containers
  const namesScrollContainer = SimpleBar.instances
    .get(document.querySelector("[data-simplebar]"))
    .getScrollElement();
  let leftScrollSync = false;
  let rightScrollSync = false;
  const leftCol = document.querySelector(
    '[class="images-scroll-container scroll-snap"]'
  );
  const oneImage = leftCol.querySelector('[class="image-item"]:nth-child(2)');
  const rightCol = namesScrollContainer;
  //   const leftMaxScrollTop = oneImage.clientHeight * 202;
  //   const rightMaxScrollTop = rightCol.scrollHeight - rightCol.clientHeight;
  //   const rightMaxScrollTop = oneName.clientHeight * 202;
  //   console.log(rightMaxScrollTop);
  leftCol.addEventListener("scroll", () => {
    const leftMaxScrollTop = oneImage.clientHeight * 202;
    const rightMaxScrollTop = rightCol.scrollHeight - rightCol.clientHeight;
    if (!leftScrollSync) {
      rightScrollSync = true;
      const leftPercScrollTop = leftCol.scrollTop / leftMaxScrollTop;
      const newRightColScrollTop = Math.ceil(
        leftPercScrollTop * rightMaxScrollTop
      );
      rightCol.scrollTop = newRightColScrollTop;
    }
    leftScrollSync = false;
  });

  rightCol.addEventListener("scroll", () => {
    const leftMaxScrollTop = oneImage.clientHeight * 202;
    const rightMaxScrollTop = rightCol.scrollHeight - rightCol.clientHeight;
    if (!rightScrollSync) {
      leftScrollSync = true;
      const rightPercScrollTop = rightCol.scrollTop / rightMaxScrollTop;
      const newLeftColScrollTop = Math.ceil(
        rightPercScrollTop * leftMaxScrollTop
      );
      leftCol.scrollTop = newLeftColScrollTop;
    }
    rightScrollSync = false;
  });
}
pokeball.style.transform = "scale(5) translate(-1em) rotate(90deg)";
const endpoint = fetch("https://pokeapi.co/api/v2/pokedex/4/");
endpoint
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  })
  .then((json) => {
    new Promise((resolve, reject) => {
      const data = json["pokemon_entries"]
        .map((entry) => {
          return entry["pokemon_species"];
        })
        .map(({ name, url }) => {
          const id = url.match(/[/][0-9]+/g)[0].slice(1);
          return {
            name,
            id,
          };
        });
      resolve(data);
    }).then((data) => {
      new Promise((resolve, reject) => {
        renderImages(data);
        renderNames(data);
        resolve();
      }).then(() => {
        imagesScrollContainer.classList.add("scroll-snap");
      });
    });
  });

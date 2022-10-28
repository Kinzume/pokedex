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
 * Returns a string with leading zeroes of the given number.
 * @param {number} entryNumber
 */
function addLeadingZeroes(entryNumber) {
  return ("000" + entryNumber).slice(-3);
}
const pokeball = document.querySelector('[class="pokeball"]');
class Pokedex {
  constructor(props) {
    this.navigateToNextItem = this.navigateToNextItem.bind(this);
    this.pokedex = props.root;
    this.imagesScrollContainer = this.pokedex.querySelector(
      '[class="images-scroll-container"]'
    );
    this.imageList = this.imagesScrollContainer.querySelector('[role="list"]');

    this.namesScrollContainer = this.pokedex.querySelector(
      '[class="names-scroll-container"]'
    );
    this.namesList = this.namesScrollContainer.querySelector('[role="list"]');

    const controls = document.createElement("ol");
    controls.setAttribute("role", "list");
    controls.classList.add("pokedex-controls");
    controls.setAttribute("aria-label", "Navigation controls");
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
      button.addEventListener("click", () =>
        this.navigateToNextItem(direction)
      );
      li.appendChild(button);
      controls.appendChild(li);
      return button;
    };
    this.navControlPrevious = createNavButton("start");
    this.navControlNext = createNavButton("end");
    this.pokedex.appendChild(controls);

    this.renderImages = this.renderImages.bind(this);
    this.renderNames = this.renderNames.bind(this);
    this.addSyncScroll = this.addSyncScroll.bind(this);
    this._handlePokedexScroll = this._handlePokedexScroll.bind(this);
    this.imagesScrollContainer.addEventListener("scroll", () => {
      this._handlePokedexScroll();
    });
    this._rotatePokeball = this._rotatePokeball.bind(this);
    this._rotatePokeball();

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
        this.renderImages(json);
        this.renderNames(json);
        this.addSyncScroll();
        this._handlePokedexScroll();
      });
  }

  /**
   * @param {'start'|'end'} direction
   */
  navigateToNextItem(direction) {
    let mediaItems = Array.from(this.imageList.querySelectorAll(":scope > *"));
    mediaItems = direction === "start" ? mediaItems.reverse() : mediaItems;
    const scrollContainerCenter = getDistanceToFocalPoint(
      this.imagesScrollContainer,
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
    this.imagesScrollContainer.scrollBy({
      top: scrollAmount,
      behavior: "smooth",
    });
  }

  _handlePokedexScroll() {
    const imagesScrollTop = Math.abs(this.imagesScrollContainer.scrollTop);
    // off-by-one correction for Chrome, where clientHeight is sometimes rounded down
    const imagesHeight = this.imagesScrollContainer.clientHeight + 1;
    const isAtStart = Math.floor(imagesScrollTop) <= 150;
    const isAtEnd =
      Math.ceil(imagesHeight + imagesScrollTop + 150) >=
      this.imagesScrollContainer.scrollHeight;
    this.navControlPrevious.setAttribute("aria-disabled", isAtStart);
    this.navControlNext.setAttribute("aria-disabled", isAtEnd);
  }
  _rotatePokeball() {
    const namesScrollContainer = SimpleBar.instances
      .get(document.querySelector("[data-simplebar]"))
      .getScrollElement();

    let leftScrollSync = false;
    let rightScrollSync = false;
    const leftCol = this.imagesScrollContainer;
    const rightCol = namesScrollContainer;
    leftCol.addEventListener("scroll", () => {
      if (!leftScrollSync) {
        rightScrollSync = true;
        const image = this.imageList.querySelector('[class="image-item"]');
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
        const name = this.namesList.querySelector('[class="name-item"]');
        // a mod b = ((a % b) + b) % b
        console.log(rightCol.scrollTop);
        const rotation = (rightCol.scrollTop / name.clientHeight) * 22.5;
        const a = rotation;
        const b = 360;
        const amodb = ((a % b) + b) % b;
        console.log(amodb);
        pokeball.style.transform = `scale(5) translate(-1em) rotate(${amodb}deg)`;
      }
      rightScrollSync = false;
    });
  }

  renderImages(json) {
    for (let i = 0; i < json["pokemon_entries"].length; i++) {
      const speciesName = json["pokemon_entries"][i]["pokemon_species"]["name"];
      const speciesUrl = json["pokemon_entries"][i]["pokemon_species"]["url"];
      const id = speciesUrl.match(/[/][0-9]+/g)[0].slice(1);
      const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/${id}.png`;
      const img = new Image();
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = speciesName;
      img.src = spriteUrl;

      const pokemonImage = document.createElement("li");
      pokemonImage.className = "image-item";
      pokemonImage.append(img);
      this.imageList.append(pokemonImage);
    }
  }
  renderNames(json) {
    for (let i = 0; i < json["pokemon_entries"].length; i++) {
      const speciesName = json["pokemon_entries"][i]["pokemon_species"]["name"];
      const pokemonName = document.createElement("li");
      pokemonName.className = "name-item";
      const entryNumber = document.createElement("span");
      entryNumber.className = "entry-number";
      const pokeball = new Image();
      pokeball.alt = "pokeball";
      pokeball.src =
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
      entryNumber.append(pokeball);
      entryNumber.append("No" + addLeadingZeroes(i + 1) + " ");
      entryNumber.setAttribute("aria-hidden", true);
      pokemonName.append(entryNumber);
      pokemonName.append(speciesName.toUpperCase());

      this.namesList.append(pokemonName);
    }
  }

  addSyncScroll() {
    // Allows the user to simultaneously scroll two containers
    const namesScrollContainer = SimpleBar.instances
      .get(document.querySelector("[data-simplebar]"))
      .getScrollElement();

    let leftScrollSync = false;
    let rightScrollSync = false;
    const leftCol = this.imagesScrollContainer;
    const rightCol = namesScrollContainer;
    const leftMaxScrollTop = leftCol.scrollHeight - leftCol.clientHeight;
    const rightMaxScrollTop = rightCol.scrollHeight - rightCol.clientHeight;

    leftCol.addEventListener("scroll", () => {
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
}

const pokedex = new Pokedex({
  root: document.querySelector(".pokedex"),
});

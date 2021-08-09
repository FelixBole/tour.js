# Tour.js

A lightweight library that will allow you to easily create interactive guides in your website or web application.

### `Demo`

To run a demo, launch `example.html` from src/example in your favorite browser.

### `Setting up the tour`

**index.html**
```html
<link rel="stylesheet" href="./tour.css">

<script src="./Spotlight.js"></script>
<script src="./Tour.js"></script>

<script>
    const steps = [
        {
            id: "elementId1",
            text: "Text to show for elementId1"
        },
        {
            id: "elementId2",
            text: "Text to show for elementId2"
        },
        // etc...
    ];

    let tour = new Tour("tour", steps);
</script>
```

### `Starting the tour`

Top start the tour, simply call `.start()` on the tour instance.

### `Options`

You can set various options for the tour such as if it should use a Spotlight, if during the tour, scrolling should be disabled and the default language for the buttons on the popups. It is pretty simple to add new language support in the Tour.js class.

Setting up options is done simply by calling `.setOptions(options)` on the tour instance and passing it an object containing the options :
```javascript
let tour = new Tour("tour", steps);

const options = {
    disableScroll: true, // Default is true
    spotlight: true, // Default is true
    language: "en", // Default is en
}

tour.setOptions(options);
```

### `Text variables`

If needed you have the option the set text variables that will be replaced in the popup text by what you have specified by calling `.setTextVariables(textVariables)` on the tour instance and passing it an object containing the key/value pairs of your text variables. The system will look for keywords formed like the following **PLACEHOLDER-YOURTEXTVARIABLE** and replace it with what you specified for that keyword.

See the example below for more details :
```javascript
const steps = [
    {
        id: "elementId1",
        text: "Text to show for elementId1 with PLACEHOLDER-VAR1"
    },
    {
        id: "elementId2",
        text: "Text to show for elementId2 with PLACEHOLDER-VAR2"
    },
    // etc...
];

const textVariables = {
    VAR1: "cookies",
    VAR2: "foobar",
};

let tour = new Tour("tour", steps);

tour.setTextVariables(textVariables);

// Step 1 will show : "Text to show for elementId1 with cookies"
```

This can come in handy when you wish to persist variables through page changes and continue the tour without having to setup a new tour entirely.

### `Persisting the tour through page changes`

To keep the tour going across different pages, you have the option to call `.save()` on the tour instance. This will save the current tour, along with its set options and variables to sessionStorage.

To retrieve a saved tour, you can call the `.getSavedTour()` static method on the Tour class like so that will return a new Tour instance containing all the saved information :
```javascript
let savedTour = Tour.getSavedTour();
```

Since the tour has already started, after obtaining a saved tour you need to call `.next()` on the savedTour instance to continue the tour.

### `Changing the style of the popups`

The tour uses an independent css file for its styling. That way, modifications to the style are very simple to adapt to your likings.
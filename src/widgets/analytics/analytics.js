const usage = `Usage:
analytics({
  pushFunction,
  [ delay=3000 ],
  [ triggerOnUIInteraction=false ],
  [ pushInitialSearch=true ]
})`;

/**
 * @typedef {Object} AnalyticsWidgetOptions
 * @property {function(qs: string, state: SearchParameters, results: SearchResults)} pushFunction
 * Function called when data are ready to be pushed. It should push the data to your analytics platform.
 * The `qs` parameter contains the parameters serialized as a query string. The `state` contains the
 * whole search state, and the `results` the last results received.
 * @property {number} [delay=3000] Number of milliseconds between last search key stroke and calling pushFunction
 * @property {boolean} [triggerOnUIInteraction=false] Trigger pushFunction after click on page or redirecting the page
 * @property {boolean} [pushInitialSearch=true] Trigger pushFunction after the initial search
 */

/**
 * The analytics widget pushes the current state of the search to the analytics platform of your
 * choice. It requires the implementation of a function that will push the data.
 *
 * This is a headless widget, which means that it does not have a rendered output in the
 * UI.
 * @type {WidgetFactory}
 * @param {AnalyticsWidgetOptions} $0 The analytics widget options
 * @return {Widget} A new instance of the analytics widget.
 */
function analytics({
  pushFunction,
  delay = 3000,
  triggerOnUIInteraction = false,
  pushInitialSearch = true,
} = {}) {
  if (!pushFunction) {
    throw new Error(usage);
  }

  let cachedState = null;

  const serializeRefinements = function(obj) {
    const str = [];
    for (const p in obj) {
      if (obj.hasOwnProperty(p)) {
        const values = obj[p].join('+');
        str.push(`${encodeURIComponent(p)}=${encodeURIComponent(p)}_${encodeURIComponent(values)}`);
      }
    }

    return str.join('&');
  };

  const serializeNumericRefinements = function(numericRefinements) {
    const numericStr = [];

    for (const attr in numericRefinements) {
      if (numericRefinements.hasOwnProperty(attr)) {
        const filter = numericRefinements[attr];

        if (filter.hasOwnProperty('>=') && filter.hasOwnProperty('<=')) {
          if (filter['>='][0] === filter['<='][0]) {
            numericStr.push(`${attr}=${attr}_${filter['>=']}`);
          } else {
            numericStr.push(`${attr}=${attr}_${filter['>=']}to${filter['<=']}`);
          }
        } else if (filter.hasOwnProperty('>=')) {
          numericStr.push(`${attr}=${attr}_from${filter['>=']}`);
        } else if (filter.hasOwnProperty('<=')) {
          numericStr.push(`${attr}=${attr}_to${filter['<=']}`);
        } else if (filter.hasOwnProperty('=')) {
          const equals = [];
          for (const equal in filter['=']) {
            if (filter['='].hasOwnProperty(equal)) { // eslint-disable-line max-depth
              equals.push(filter['='][equal]);
            }
          }

          numericStr.push(`${attr}=${attr}_${equals.join('-')}`);
        }
      }
    }

    return numericStr.join('&');
  };

  let lastSentData = '';
  const sendAnalytics = function(state) {
    if (state === null) {
      return;
    }

    let formattedParams = [];

    const serializedRefinements = serializeRefinements(Object.assign(
      {},
      state.state.disjunctiveFacetsRefinements,
      state.state.facetsRefinements,
      state.state.hierarchicalFacetsRefinements
    ));

    const serializedNumericRefinements = serializeNumericRefinements(state.state.numericRefinements);

    if (serializedRefinements !== '') {
      formattedParams.push(serializedRefinements);
    }

    if (serializedNumericRefinements !== '') {
      formattedParams.push(serializedNumericRefinements);
    }

    formattedParams = formattedParams.join('&');

    const dataToSend = `Query: ${state.state.query}, ${formattedParams}`;

    if (lastSentData !== dataToSend) {
      pushFunction(formattedParams, state.state, state.results);

      lastSentData = dataToSend;
    }
  };

  let pushTimeout;

  let isInitialSearch = true;
  if (pushInitialSearch === true) {
    isInitialSearch = false;
  }

  return {
    init() {
      if (triggerOnUIInteraction === true) {
        document.addEventListener('click', () => {
          sendAnalytics(cachedState);
        });

        window.addEventListener('beforeunload', () => {
          sendAnalytics(cachedState);
        });
      }
    },
    render({results, state}) {
      if (isInitialSearch === true) {
        isInitialSearch = false;

        return;
      }

      cachedState = {results, state};

      if (pushTimeout) {
        clearTimeout(pushTimeout);
      }

      pushTimeout = setTimeout(() => sendAnalytics(cachedState), delay);
    },
  };
}

export default analytics;

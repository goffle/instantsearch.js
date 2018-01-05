import cx from 'classnames';
import noop from 'lodash/noop';
import { bemHelper } from '../../lib/utils';
import connectGeoSearch from '../../connectors/geo-search/connectGeoSearch';
import renderer from './GeoSearchRenderer';
import defaultTemplates from './defaultTemplates';

const bem = bemHelper('ais-geo-search');

const geoSearch = (props = {}) => {
  const widgetParams = {
    enableClearMapRefinement: true,
    enableRefineControl: true,
    cssClasses: {},
    templates: {},
    paddingBoundingBox: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    createMarkerOptions: noop,
    createModalOptions: noop,
    ...props,
  };

  const { cssClasses: userCssClasses, container } = widgetParams;

  if (!container) {
    throw new Error(`Must provide a container.`);
  }

  const cssClasses = {
    root: cx(bem(null), userCssClasses.root),
    map: cx(bem('map'), userCssClasses.map),
    controls: cx(bem('controls'), userCssClasses.controls),
    clear: cx(bem('clear'), userCssClasses.clear),
    control: cx(bem('control'), userCssClasses.control),
    toggleLabel: cx(bem('toggle-label'), userCssClasses.toggleLabel),
    toggleInput: cx(bem('toggle-input'), userCssClasses.toggleInput),
    redo: cx(bem('redo'), userCssClasses.redo),
  };

  try {
    const makeGeoSearch = connectGeoSearch(renderer);

    return makeGeoSearch({
      ...widgetParams,
      templates: {
        ...defaultTemplates,
        ...widgetParams.templates,
      },
      renderState: {},
      cssClasses,
    });
  } catch (e) {
    throw new Error(`See usage.`);
  }
};

export default geoSearch;
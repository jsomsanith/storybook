import React from 'react';
import memoize from 'memoizerific';

import { Badge } from '@storybook/components';
import { Consumer } from '@storybook/api';

import { shortcutToHumanString } from '../libs/shortcut';

import ListItemIcon from '../components/sidebar/ListItemIcon';
import Sidebar from '../components/sidebar/Sidebar';

const focusableUIElements = {
  storySearchField: 'storybook-explorer-searchfield',
  storyListMenu: 'storybook-explorer-menu',
  storyPanelRoot: 'storybook-panel-root',
};

const createMenu = memoize(1)((api, shortcutKeys, isFullscreen, showPanel, showNav) => [
  {
    id: 'S',
    title: 'Show sidebar',
    onClick: () => api.toggleNav(),
    right: shortcutToHumanString(shortcutKeys.toggleNav),
    left: showNav ? <ListItemIcon icon="check" /> : <ListItemIcon />,
  },
  {
    id: 'A',
    title: 'Show addons',
    onClick: () => api.togglePanel(),
    right: shortcutToHumanString(shortcutKeys.togglePanel),
    left: showPanel ? <ListItemIcon icon="check" /> : <ListItemIcon />,
  },
  {
    id: 'D',
    title: 'Change addons orientation',
    onClick: () => api.togglePanelPosition(),
    right: shortcutToHumanString(shortcutKeys.panelPosition),
    left: <ListItemIcon />,
  },
  {
    id: 'F',
    title: 'Go full screen',
    onClick: api.toggleFullscreen,
    right: shortcutToHumanString(shortcutKeys.fullScreen),
    left: isFullscreen ? 'check' : <ListItemIcon />,
  },
  {
    id: '/',
    title: 'Search',
    onClick: () => api.focusOnUIElement(focusableUIElements.storySearchField),
    right: shortcutToHumanString(shortcutKeys.search),
    left: <ListItemIcon />,
  },
  {
    id: 'up',
    title: 'Previous component',
    onClick: () => api.jumpToComponent(-1),
    right: shortcutToHumanString(shortcutKeys.prevComponent),
    left: <ListItemIcon />,
  },
  {
    id: 'down',
    title: 'Next component',
    onClick: () => api.jumpToComponent(1),
    right: shortcutToHumanString(shortcutKeys.nextComponent),
    left: <ListItemIcon />,
  },
  {
    id: 'prev',
    title: 'Previous story',
    onClick: () => api.jumpToStory(-1),
    right: shortcutToHumanString(shortcutKeys.prevStory),
    left: <ListItemIcon />,
  },
  {
    id: 'next',
    title: 'Next story',
    onClick: () => api.jumpToStory(1),
    right: shortcutToHumanString(shortcutKeys.nextStory),
    left: <ListItemIcon />,
  },
  {
    id: 'about',
    title: 'About your Storybook',
    onClick: () => api.navigate('/settings/about'),
    right: api.versionUpdateAvailable() && <Badge status="positive">Update</Badge>,
    left: <ListItemIcon />,
  },
  {
    id: 'shortcuts',
    title: 'Keyboard shortcuts',
    onClick: () => api.navigate('/settings/shortcuts'),
    right: shortcutToHumanString(shortcutKeys.shortcutsPage),
    left: <ListItemIcon />,
  },
]);

const collapseDocsOnlyStories = storiesHash => {
  // keep track of component IDs that have been rewritten to the ID of their first leaf child
  const componentIdToLeafId = {};
  const docsOnlyStoriesRemoved = Object.values(storiesHash).filter(item => {
    if (item.isLeaf && item.parameters && item.parameters.docsOnly) {
      componentIdToLeafId[item.parent] = item.id;
      return false; // filter it out
    }
    return true;
  });
  const docsOnlyComponentsCollapsed = docsOnlyStoriesRemoved.map(item => {
    // collapse docs-only components
    const { isComponent, children, id } = item;
    if (isComponent && children.length === 1) {
      const leafId = componentIdToLeafId[id];
      if (leafId) {
        const collapsed = {
          ...item,
          id: leafId,
          isLeaf: true,
          children: undefined,
        };
        return collapsed;
      }
    }

    // update groups
    if (children) {
      const rewritten = children.map(child => componentIdToLeafId[child] || child);
      return { ...item, children: rewritten };
    }

    // pass through stories unmodified
    return item;
  });

  const result = {};
  docsOnlyComponentsCollapsed.forEach(item => {
    result[item.id] = item;
  });
  return result;
};

export const mapper = ({ state, api }) => {
  const {
    ui: { name, url },
    viewMode,
    storyId,
    layout: { isFullscreen, showPanel, showNav, panelPosition },
    storiesHash,
    storiesConfigured,
  } = state;

  const stories = collapseDocsOnlyStories(storiesHash);

  const shortcutKeys = api.getShortcutKeys();
  return {
    loading: !storiesConfigured,
    title: name,
    url,
    stories,
    storyId,
    viewMode,
    menu: createMenu(api, shortcutKeys, isFullscreen, showPanel, showNav, panelPosition),
    menuHighlighted: api.versionUpdateAvailable(),
  };
};

export default props => (
  <Consumer filter={mapper}>{fromState => <Sidebar {...props} {...fromState} />}</Consumer>
);

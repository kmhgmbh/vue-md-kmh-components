import Vue from 'vue';
import VueMaterial from 'vue-material';
import VueMdl from 'vue-mdl';
import Main from './main';

import VueMq from 'vue-mq'

import 'vue-material/dist/vue-material.min.css'

Vue.use(VueMaterial)

Vue.use(VueMq, {
  breakpoints: { // default breakpoints - customize this
    sm: 450,
    md: 1250,
    lg: Infinity,
  }
});

require('material-design-lite/material.min.js');
require('material-design-lite/material.min.css');

Vue.use(VueMdl);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  ...Main,
});

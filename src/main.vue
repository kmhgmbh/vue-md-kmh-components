<template>
  <div id="app" class="component">
    <VueDatatable
        :headData="birdsHeadData"
        :data="birds"
        :selectable="true"
        selectedRowIndexKey="id"
        :max="maxRows"

        ref="birdsTable"
        v-on:rowSelectionChange="selectedRowsChanged"
      >
      </VueDatatable>

      <md-field>
        <label>Number of Birds</label>
        <md-input type="number" v-model="numBirds"></md-input>
      </md-field>

      <md-field>
        <label>Number of Rows</label>
        <md-input type="number" v-model="maxRows"></md-input>
      </md-field>


      <md-button @click.native="generateRandomData()">
        Generate Random Data
      </md-button>

      <md-button @click.native="addRandomData()">
        Add Random Data
      </md-button>

      <md-button @click.native="setAllSelected()">
        Select All
      </md-button>

    </div>
  </div>
</template>

<script>
import Faker from 'faker';
import moment from 'moment';

import VueDatatable from './components/data-table/data-table';

const varieties = [
  'Owl',
  'Eagle',
  'Peacock',
  'Woodpecker',
  'Cockoo',
  'Parrot',
];

export default {
  name: 'app',

  components: {
    VueDatatable,
  },

  data() {
    return {
      birds: [],
      numBirds: 10,
      maxRows: 10,
      addRowMeta: {
        label: 'neu',
        action: () => {
          console.log('yay');
        },
      },
      birdsHeadData: [
        {
          key: 'id',
          name: 'Database ID',
        },
        {
          key: 'name',
          name: 'Birds Name',
        }, {
          key: 'variety',
          name: 'Birds variety',
        }, {
          key: 'size',
          name: 'Size of Bird',
          format: (value) => {
            if (value) {
              return `${value} mm`;
            }
            return '';
          },
        }, {
          key: 'discoveryDate',
          name: 'Discovery Date',
        }, {
          key: 'extinct',
          onlyState: true,
        }, {
          key: 'wingCount',
          name: 'Number of wings',
        }, {
          key: 'maxAge',
          name: 'Average max age',
        }, /* {
          keys: [
            {
              key: ':icon',
              name: 'delete',
              action: (rowData) => {

              },
              isActive: (row) => {
                return row.status === 'Geplant'
              },
            },
          ],
        }, */
      ],
    };
  },

  created() {
    this.generateRandomData();
  },

  methods: {
    selectedRowsChanged(rows) {
      console.log(rows);
    },

    setAllSelected() {
      this.$refs.birdsTable.selectAllRowsFlag = !this.$refs.birdsTable.selectAllRowsFlag;
      this.$refs.birdsTable.toggleSelectAllRows();
    },

    addRandomData() {
      const birdsBefore = this.birds.slice(0);
      const newBirds = [];

      for (let i = 0; i < this.numBirds; i += 1) {
        newBirds.push({
          id: `${i}`,
          name: Faker.name.firstName(),
          variety: varieties[Math.floor(Math.random() * 5)],
          discoveryDate: this.randomDate(),
          size: Math.floor((Math.random() * 1000) + 1),
          extinct: Math.floor((Math.random() * 3) - 1),
          wingCount: 2,
          maxAge: (Math.random() * 40).toFixed(2),
        });
      }

      this.birds = birdsBefore.concat(newBirds);
    },

    randomDate() {
      const start = new Date(1800,1,1);
      const end = new Date();
      const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      return moment(randomDate).format('DD.MM.YYYY');
    },

    generateRandomData() {
      this.birds = [];

      for (let i = 0; i < this.numBirds; i += 1) {
        this.birds.push({
          id: `${i}`,
          name: Faker.name.firstName(),
          variety: varieties[Math.floor(Math.random() * 5)],
          discoveryDate: this.randomDate(),
          size: Math.floor((Math.random() * 1000) + 1),
          extinct: Math.floor((Math.random() * 3) - 1),
          wingCount: 2,
          maxAge: (Math.random() * 40).toFixed(2),
        });
      }
    },
  },
};
</script>
<style lang="sass" src="./styles/theme.sass"></style>

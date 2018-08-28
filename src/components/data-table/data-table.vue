<template src="./data-table.html"></template>

<script>
import Vue from 'vue'
import moment from 'moment'
import uuid from 'uuid'

export default {
  name: 'data-table',

  props: {
    // data definition of columns
    headData: {
      type: Array,
      default: () => [],
    },
    // rows
    data: {
      type: Array,
      default: () => [],
    },
    // number of rows per page
    max: {
      type: Number,
      default: 20,
    },
    // activate pagination
    pager: {
      type: Boolean,
      default: true,
    },
    // array of column keys to ignore
    ignoreColumns: {
      type: Array,
      default: () => [],
    },
    // activate search feature
    search: {
      type: Boolean,
      default: true,
    },
    // activate icon feature
    icons: {
      type: Boolean,
      default: true,
    },
    // activate sortable columns
    sortable: {
      type: Boolean,
      default: true,
    },
    // activate select feature
    selectable: {
      type: Boolean,
      default: false,
    },
    // key used by row selection
    selectedRowIndexKey: {
      type: String,
      default: null,
    },
  },

  computed: {
    pages () {
      let length = 1
      if (this.rowData.length) {
        length = this.rowData.length / this.max
        if (length < 1) {
          length = 1
        }
      }
      length = Math.ceil(length)
      return length
    },

    dynamicWidth () {
      if (this.$mq.resize && this.$mq.below(600)) {
        return ''
      }
      return {
        'max-width': `${parseInt((100 / this.columnCount), 10)}%`,
      }
    },

    withBlock () {
      return !!this.$slots.default
    },

    shouldPagerBeDisplayed () {
      return this.pager && this.data.length
    },
  },

  data () {
    return {
      id: -1,
      show: false,
      searchContainer: [],
      searchColumnFilter: [],
      sortedColumns: new Map(),
      columnCount: 0,
      page: 1,
      pagesToShow: [],
      sortedData: [],
      visibleBlock: null,
      selectedRows: [],
      selectedRowsByIndexKey: [],
      selectAllRowsFlag: false,
      emptyHead: '...',
      columsToShow: [],
      isFilterActive: false,
    }
  },

  created () {
    this.rowData = this.data
    this.init()
  },

  watch: {
    data() {
      this.pageRows(this.page - 1)
      this.addSelectedProp(this.data.filter(row => row.$isSelected === undefined))
    },
  },

  methods: {
    /**
     * @name init
     * @description initialize this page
     * @fires this.pushBreadcrumb
     * @fires transition
     */
    init () {
      this.extractColumnsToShow()

      this.id = this._uid
      this.columnCount = this.headData.length

      this.rowData = this.rowData.map((row) => {
        const newRow = row
        newRow.$isSelected = false
        return newRow
      })

      this.addSelectedProp(this.data);

      this.pageRows(0);

      this.$nextTick(() => {
        this.show = true
      })
    },

    addSelectedProp(rows) {
      this.allRows.concat(rows.map((row) => {
        const generatedUuid = uuid.v4();

        const newRow = row;
        const newMapRow = {
          row: newRow,
          mutableProps: {
            isSelected: false,
          },
        };

        Object.defineProperty(newRow, '$isSelected', {
          get: () => {
            const mapRow = this.rowMap.get(generatedUuid).mutableProps;
            if (!mapRow.isSelected) {
              return false;
            }
            return mapRow.isSelected;
          },
          set: (newValue) => {
            this.$forceUpdate();
            this.rowMap.get(generatedUuid).mutableProps.isSelected = newValue;
          },
        });

        newRow.mapRef = generatedUuid;

        this.rowMap.set(generatedUuid, newMapRow);
        return newRow;
      }));
    },

    noSearchFilter () {
      return this.searchColumnFilter.filter(column => column === '').length === 0
    },

    gotoPage(pageNum) {
      this.page = pageNum;
      this.pageRows(pageNum - 1);
      this.$forceUpdate();
    },

    updatePagesToShow() {
      const pageRange = [];

      const numPages = Math.ceil(this.allRows.length / this.max);
      const isNextPageInRange = this.page + 1 <= numPages;
      const isPrevPageInRange = this.page - 1 > 0;

      if (this.page - 2 > 0) {
        pageRange.push(1);
        if (this.page - 3 > 0) {
          pageRange.push('...');
        }
      }
      if (isPrevPageInRange
        && !isNextPageInRange
        && this.page - 3 > 0) {
        pageRange.push(this.page - 2);
        pageRange.push(this.page - 1);
      } else if (isPrevPageInRange) {
        pageRange.push(this.page - 1);
      }
      pageRange.push(this.page);
      if (!isPrevPageInRange
        && isNextPageInRange
        && this.page + 3 <= numPages) {
        pageRange.push(this.page + 1);
        pageRange.push(this.page + 2);
      } else if (isNextPageInRange) {
        pageRange.push(this.page + 1);
      }
      if (this.page + 2 <= numPages) {
        if (this.page + 3 <= numPages) {
          pageRange.push('...');
        }
        pageRange.push(numPages);
      }

      this.pagesToShow = pageRange;
    },

    isSortedAfter(key) {
      return this.sortedColumns.get(key);
    },

    noSearchFilter() {
      return this.searchColumnFilter.filter(column => column === '').length === 0;
    },

    orderRows(rows) {
      if (!this.sortedColumns.size) {
        return rows;
      }
      return this.orderedRows(rows, {
        column: this.sortedColumns.keys().next().value,
        order: this.sortedColumns.values().next().value,
      });
    },

    orderedRows(rows, sortSettings = null) {
      let actualSortSettings = sortSettings;
      if (!actualSortSettings) {
        actualSortSettings = {
          column: this.headData[0].key,
          order: 'ASC',
        };
      }

      let sortReturnLower = -1;
      let sortReturnHigher = 1;
      if (actualSortSettings.order === 'DESC') {
        sortReturnLower = 1;
        sortReturnHigher = -1;
      }

      return rows.sort((a, b) => {
        let valueA = a[actualSortSettings.column];
        let valueB = b[actualSortSettings.column];

        const dateRegExp = /[0-3]{1}[0-9]{1}\.[0-1]{1}[0-9]{1}\.[0-9]{4}/;

        const isDate = dateRegExp.test(valueA) && dateRegExp.test(valueB);

        if (isDate) {
          valueA = moment(valueA, 'DD.MM.YYYY').format('YYYY-MM-DD');
          valueB = moment(valueB, 'DD.MM.YYYY').format('YYYY-MM-DD');
        } else if (parseFloat(valueA) && parseFloat(valueB)) {
          valueA = parseFloat(valueA);
          valueB = parseFloat(valueB);
        } else if (parseInt(valueA, 10)
          && parseInt(valueB, 10)) {
          valueA = parseInt(valueA, 10);
          valueB = parseInt(valueB, 10);
        } else {
          valueA = valueA.toString().toUpperCase();
          valueB = valueB.toString().toUpperCase();
        }

        if (valueA < valueB) {
          return sortReturnLower;
        }
        if (valueA > valueB) {
          return sortReturnHigher;
        }

        return 0;
      });
    },

    searchedRows(rows) {
      if (this.isFilterActive) {
        return rows.filter((row) => {
          return Object.keys(row).reduce((acc, key) => {
            if (this.searchColumnFilter[key]) {
              /* eslint-disable */
              let convertedWildcards = this.searchColumnFilter[key].replace('*', '[\\d\\w]*');
              convertedWildcards = convertedWildcards.replace('?', '[\\d\\w]');
              /* eslint-enable */
              const regex = new RegExp(convertedWildcards, 'i');
              return regex.test(row[key]) && acc;
            } else {
              return acc
            }
          }, true);
        });
      }
      return rows;
    },

    searchedAndOrderedRows(rows) {
      const searchedRows = this.searchedRows(rows);
      const orderedRows = this.orderRows(searchedRows);

      return orderedRows;
    },

    pagedRows(rows, { pageSize, pageNum } = {}) {
      const startIndex = pageSize * (pageNum);
      const endIndex = pageSize * (pageNum + 1);

      return this.searchedAndOrderedRows(rows).slice(startIndex, endIndex);
    },

    pageRows(pageNum) {
      const rowsClone = this.data.slice(0);

      this.rowsToShow = this.pagedRows(
        rowsClone,
        { pageSize: this.max, pageNum }
      );
      this.allRows = this.searchedAndOrderedRows(rowsClone);
      this.$emit('rowsUpdated', this.allRows);
      this.updatePagesToShow();
    },

    /**
     * Get lens color for states based on meta information
     * @param {Object} columnMeta
     * @param {any} value
     */
    lensColor (columnMeta, value) {
      let color = ''
      if (columnMeta.stateMapping) {
        const index = `${value}`
        if (columnMeta.stateMapping[index]) {
          color = columnMeta.stateMapping[index]
        }
      } else {
        color = Boolean(value) ? 'green' : 'red'
      }
      return color
    },

    /**
     * @name doIconAction
     * @description create an link + redirect || generate + open sidebar
     * @param {String} path
     * @param {Object} rowData
     * @fires this.linkCustom
     * @fires this.setSidebar
     */
    generateAndExecuteLink (path, rowData) {
      const newPath = path
      for (let keyIndex in path.params) {
        let key = path.params[keyIndex]
        let value = ''
        if (typeof key === 'object') {
          for (let childKeyIndex in key) {
            let childKey = key[childKeyIndex]
            value += value !== '' ? '-' : ''
            value += rowData[childKey]
          }
          newPath.params[keyIndex] = this.encode(value)
        }
        this.linkCustom(newPath)
      }
    },

    getIconName (icon, index) {
      if (typeof icon === 'function') {
        return icon(this.rowData[index])
      }
      return icon
    },

    /**
     * Handle CTA button click
     *
     * @param {Object} meta
     * @param {Object} rowData
     */
    triggerCTA (meta, rowData) {
      if (meta.action) {
        meta.action(rowData)
      } else if (meta.link) {
        this.generateAndExecuteLink(meta.link, rowData)
      }
    },

    /**
     * Extract column names which should appear in table
     */
    extractColumnsToShow () {
      this.headData.forEach((item) => {
        if (item.key) {
          this.columsToShow.push(item.key)
        }
      })
    },

    /**
     * @name ignore
     * @description check if an column should ignored
     * @requires this.ignoreColumns
     * @return {Boolean}
     */
    ignore (index) {
      return this.ignoreColumns.includes(index) || !this.columsToShow.includes(index)
    },

    rowId (index) {
      if (this.rowData && this.rowData[0]) {
        return `${this.rowData[0].constructor.name}-${index}`
      }
      return `row-${index}`
    },

    /**
     * Check if row is activated and the slot should be visible
     * @param {Number} rowIndex
     */
    isVisibleBlock (rowIndex) {
      const id = this.rowId(rowIndex)
      return this.visibleBlock === id
    },

    /**
     * Toggle row activation and slot visibility
     * Trigger slot inherent component if appropriate method is available
     * @param {Number} rowIndex
     * @param {any} rowData
     */
    toggleBlock (rowIndex, rowData) {
      const id = this.rowId(rowIndex)

      if (this.visibleBlock === id) {
        this.visibleBlock = null
      } else {
        this.visibleBlock = id
        this.$nextTick(() => {
          if (this.$slots.default && this.$slots.default[0].componentInstance && this.$slots.default[0].componentInstance.update) {
            this.$slots.default[0].componentInstance.update(rowData)
          }
        })
      }
    },

    /**
     * @name isOnlyState
     * @description check if an column is only a state (colored ball)
     * @param {String} index
     * @requires this.headData
     * @return {Boolean}
     */
    isOnlyState (index) {
      this.headData.reduce((onlyState, column) => {
        if (column.key === index && column.onlyState) {
          return column.onlyState
        }
        return onlyState
      }, false)
    },

    /**
     * Check if action button/icon should be active
     * @param meta
     * @param row
     */
    isActionActive (meta, row) {
      if (meta.isActive) {
        return meta.isActive(row)
      }
      return meta.link !== ''
    },

    /**
     * Check if action button/icon should be hidden
     * @param meta
     * @param row
     */
    isActionHidden (meta, row) {
      if (meta.isHidden) {
        return meta.isHidden(row)
      }
      return false
    },

    columnFilterMatched(row) {
      for (let column in this.searchColumnFilter) {
        if (row[column]
            .toString()
            .toLowerCase()
            .indexOf(this.searchColumnFilter[column].toLowerCase()) < 0) {
          return false
        }
      }
      return true
    },

    pagerPrev() {
      if (this.page - 1 > 0) {
        this.pageRows((this.page - 1) - 1);
        this.page -= 1;
      }
    },

    pagerNext() {
      if (this.page < (this.allRows.length / this.max)) {
        this.pageRows(this.page);
        this.page += 1;
      }
    },

    rowOnCurrentPage (index) {
      if (this.noSearchFilter()) {
        const max = this.page * this.max
        const min = max - this.max
        if (index >= min && index < max) {
          return true
        }
        return false
      }
      return true
    },

    toggleSelectAllRows() {
      let rowsToSelect = this.allRows.slice(0);
      if (this.selectAllOnlyOnPage) {
        rowsToSelect = this.rowsToShow.slice(0);
      }
      const currentSelectedFlag = this.selectAllRowsFlag;

      /* eslint-disable */
      rowsToSelect.forEach((row) => {
        if (!currentSelectedFlag) {
          row.$isSelected = true;
        }
        if (row.$isSelected !== currentSelectedFlag) {
          row.$isSelected = currentSelectedFlag;
        }
      });
      /* eslint-enable */

    toggleSelectAllRows () {
      this.data = this.data.map((row) => {
        const newRow = row
        newRow.$isSelected = this.selectAllRowsFlag
        return newRow
      })
      this.selectedRowsByIndexKey = this.getAllSelectedRows()
      this.$emit('rowSelectionChange', this.selectedRowsByIndexKey)
    },

    rowClicked (e) {
      this.$emit('rowClicked', e)
    },

    getAllSelectedRows () {
      return this.rowData.reduce((acc, row) => {
        if (row.$isSelected) {
          acc.push(row[this.selectedRowIndexKey])
        }
        return acc
      }, [])
    },

    rowSelectInput() {
      this.selectAllRowsFlag = false;

      if (this.selectedRowIndexKey) {
        this.selectedRowsByIndexKey = this.getAllSelectedRows();
        this.$emit('rowSelectionChange', this.selectedRowsByIndexKey);
      }
    },

    toggleDataRowSelection () {
      this.selectAllRowsFlag = false
      // this.SelectedRows will be handled by checkbox

      if (this.selectedRowIndexKey) {
        this.selectedRowsByIndexKey = this.getAllSelectedRows()
        this.$emit('rowSelectionChange', this.selectedRowsByIndexKey)
      }
    },

    highlight (column, text) {
      const key = column.key
      text = column.type
        ? this.resolveValue(column, text)
        : text
      if (this.searchColumnFilter[key] != null) {
        const pattern = this.searchColumnFilter[key]
        if (pattern !== '') {
          const index = text.toString().toLowerCase().indexOf(pattern.toLowerCase())
          if (index >= 0) {
            return `${text.toString().substring(0, index)}
              <span class="highlight">
              ${text.substring(index, index + pattern.length)}
              </span>
              ${text.substring(index + pattern.length)}`
          }
        }
      }
      return text
    },

    resolveValue (column, text) {
      if (column.type) {
        switch (column.type) {
          case 'date':
            return column.format ? moment(text).format(column.format) : moment(text).format('YYYY-MM-DD')
        }
      }
      return text
    },

    updateSearchColumnFilter(input, column) {
      if (input === '') {
        delete this.searchColumnFilter[column];
      } else {
        this.searchColumnFilter[column] = input;
      }

      this.isFilterActive = Object.keys(this.searchColumnFilter).length > 0;

      this.pageRows(0);
    },

    clearSearchContainer(id, column) {
      if (this.searchContainer.indexOf(id) > -1) {
        this.searchContainer.splice(this.searchContainer.indexOf(id), 1);
      }
      this.updateSearchColumnFilter('', column);
    },

    getSearchContainer(id) {
      return this.searchContainer.includes(id);
    },

    setSearchContainer(id, inputId) {
      this.searchContainer.push(id);
      this.$nextTick(() => {
        document.getElementById(inputId).focus();
      });
    },

    sortAsc(key) {
      this.sortedColumns.set(key, 'ASC');
    },

    sortDesc(key) {
      this.sortedColumns.set(key, 'DESC');
    },

    sort(head) {
      // quirk as long as the ordering only works for one key
      const foundSortColumn = this.sortedColumns.get(head.key);

      if (!foundSortColumn) {
        if (this.sortedColumns.size === 1) {
          this.sortedColumns.clear();
        }
        if (this.sortedColumns[head.key] !== null) {
          this.sortedData = this.data
          this.sortedData.sort(this.sortData(head.key, this.sortedColumns[head.key]))
        }
        this.$forceUpdate()
      }
      this.pageRows(this.page - 1);
    },

    getAncestor (node, tagName) {
      const tagNameUpper = tagName.toUpperCase()
      let traversingNode = node

      while (traversingNode) {
        if (traversingNode.nodeType === 1 && traversingNode.nodeName === tagNameUpper) {
          return traversingNode
        }
        traversingNode = traversingNode.parentNode
      }

      return null
    },

    encode (value, noHyphen) {
      if (!value) {
        return ''
      }
      value += '' // Convert integer
      value = value.toLowerCase()
      value = value.replace('.', '')
      value = value.replace(/Ä/g, 'Ae')
      value = value.replace(/ä/g, 'ae')
      value = value.replace(/Ö/g, 'Oe')
      value = value.replace(/ö/g, 'oe')
      value = value.replace(/Ü/g, 'Ue')
      value = value.replace(/ü/g, 'ue')
      value = value.replace(/ß/g, 'ss')
      value = value.replace(' ', '-')
      value = value.replace(/[^a-z0-9-_]/gi, '')
      if (noHyphen && noHyphen === true) {
        value = value.replace('-', '_')
      }
      return value
    },
  },
}
</script>

<style src="./data-table.styl" lang="stylus"></style>
<style src="./data-table-plugins.styl" lang="stylus"></style>

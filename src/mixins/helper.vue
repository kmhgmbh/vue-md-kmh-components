<script>
export default {
  name: 'helper',

  methods: {
    /**
     * @name encode
     * @description encode (part of) url
     * @param {String} value url/-part
     * @return {String} encoded url
     */
    encode (value, noHyphen = false) {
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
      if (noHyphen === true) {
        value = value.replace('-', '_')
      }
      return value
    },

    clearBit (value, bit) {
      return (value &= ~(1 << bit))
    },

    setBit (value, bit) {
      return (value |= 1 << bit)
    },

    checkBit (value, bit) {
      return ((value >> bit) & 1)
    }
  }
}
</script>

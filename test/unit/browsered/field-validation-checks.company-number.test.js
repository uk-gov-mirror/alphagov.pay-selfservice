'use strict'

const { isNotCompanyNumber } = require('../../../app/browsered/field-validation-checks')

describe('isNotCompanyNumber', () => {
  describe('UK company number validations', () => {
    it(
      'should validate that England and Wales limited company number is valid',
      () => {
        expect(isNotCompanyNumber('01234567')).toBe(false) // eslint-disable-line
      }
    )

    it('should validate that England and Wales LLP number is valid', () => {
      expect(isNotCompanyNumber('OC123456')).toBe(false) // eslint-disable-line
    })

    it(
      'should validate that England and Wales limited partnership number is valid',
      () => {
        expect(isNotCompanyNumber('LP123456')).toBe(false) // eslint-disable-line
      }
    )

    it('should validate that Scotland limited company number is valid', () => {
      expect(isNotCompanyNumber('SC123456')).toBe(false) // eslint-disable-line
    })

    it('should validate that Scotland LLP number is valid', () => {
      expect(isNotCompanyNumber('SO123456')).toBe(false) // eslint-disable-line
    })

    it(
      'should validate that Scotland limited partnership number is valid',
      () => {
        expect(isNotCompanyNumber('SL123456')).toBe(false) // eslint-disable-line
      }
    )

    it(
      'should validate that Northern Ireland limited company number is valid',
      () => {
        expect(isNotCompanyNumber('NI123456')).toBe(false) // eslint-disable-line
      }
    )

    it(
      'should validate that Northern Ireland pre-partition limited company number is valid',
      () => {
        expect(isNotCompanyNumber('R0123456')).toBe(false) // eslint-disable-line
      }
    )

    it('should validate that Northern Ireland LLP number is valid', () => {
      expect(isNotCompanyNumber('NC123456')).toBe(false) // eslint-disable-line
    })

    it(
      'should validate that Northern Ireland limited partnership number is valid',
      () => {
        expect(isNotCompanyNumber('NL123456')).toBe(false) // eslint-disable-line
      }
    )

    it('should validate that company number with spaces is valid', () => {
      expect(isNotCompanyNumber(' 0 123 45 67 ')).toBe(false) // eslint-disable-line
    })

    it(
      'should validate that company number with lower-case prefix is valid',
      () => {
        expect(isNotCompanyNumber('sc123456')).toBe(false) // eslint-disable-line
      }
    )

    it(
      'should validate that company number of 8 digits without leading 0 is invalid',
      () => {
        expect(isNotCompanyNumber('12345678')).toBe('Enter a valid company number') // eslint-disable-line
      }
    )

    it(
      'should validate that NI pre-partition company number without leading R0 is invalid',
      () => {
        expect(isNotCompanyNumber('R1234567')).toBe('Enter a valid company number') // eslint-disable-line
      }
    )

    it('should validate that company number of 6 digits is invalid', () => {
      expect(isNotCompanyNumber('123456')).toBe('Enter a valid company number') // eslint-disable-line
    })

    it(
      'should validate that company number of 7 digits is invalid (with special message)',
      () => {
        expect(isNotCompanyNumber('1234567')).toBe(
          'Company numbers in England and Wales have 8 digits and always start with 0'
        ) // eslint-disable-line
      }
    )

    it('should validate that company number of 9 digits is invalid', () => {
      expect(isNotCompanyNumber('012345678')).toBe('Enter a valid company number') // eslint-disable-line
    })

    it('should validate that company number of 9 digits is invalid', () => {
      expect(isNotCompanyNumber('012345678')).toBe('Enter a valid company number') // eslint-disable-line
    })

    it(
      'should validate that company number with prefix and 5 digits is invalid',
      () => {
        expect(isNotCompanyNumber('NI12345')).toBe('Enter a valid company number') // eslint-disable-line
      }
    )

    it(
      'should validate that company number with prefix and 7 digits is invalid',
      () => {
        expect(isNotCompanyNumber('NC1234567')).toBe('Enter a valid company number') // eslint-disable-line
      }
    )

    it(
      'should validate that company number with unrecognised prefix is invalid',
      () => {
        expect(isNotCompanyNumber('RC123456')).toBe('Enter a valid company number') // eslint-disable-line
      }
    )
  })
})

import defaultTheme from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';
import typographyPlugin from '@tailwindcss/typography';
import formsPlugin from '@tailwindcss/forms';

function withOpacityValue(variable) {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) {
      return `rgb(var(${variable}))`;
    }
    return `rgb(var(${variable}) / ${opacityValue})`;
  };
}

export default {
  content: ['./src/**/*.{astro,html,js,jsx,json,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      // Enhanced font system combining both approaches
      fontFamily: {
        // Add your custom fonts using CSS variables
        primary: ['var(--font-inter)', 'var(--aw-font-sans, ui-sans-serif)', ...defaultTheme.fontFamily.sans],
     },

      // Enhanced screen breakpoints
      screens: {
        '2xs': '425px',
        big: '990px',
        '3xl': '2080px',
      },

      // Custom spacing for layout consistency
      spacing: {
        square: 'var(--square-size)',
        'square-container': 'calc(var(--square-size) * 3)',
        'nav-height': 'var(--navbar-height)',
      },

      // Comprehensive color system
      colors: {
        // Keep AstroWind variables for theme compatibility
        primary: {
          // Customize it on globals.css :root
          50: withOpacityValue('--tw-color-primary-50'),
          100: withOpacityValue('--tw-color-primary-100'),
          200: withOpacityValue('--tw-color-primary-200'),
          300: withOpacityValue('--tw-color-primary-300'),
          400: withOpacityValue('--tw-color-primary-400'),
          500: withOpacityValue('--tw-color-primary-500'),
          600: withOpacityValue('--tw-color-primary-600'),
          700: withOpacityValue('--tw-color-primary-700'),
          800: withOpacityValue('--tw-color-primary-800'),
          900: withOpacityValue('--tw-color-primary-900'),
        },
        dark: '#222222',


        

        // Semantic colors for better UX
        surface: {
          'pure-white': '#FFFFFF',
          white: '#FAFAFA',
          'white-alt': '#F2F2F2',
          'background-light': '#1A1F1F',
          'pure-black': '#000000',
          black: '#111111',
        },
      },

      keyframes: {
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': {
            opacity: 0.99,
            filter:
              'drop-shadow(0 0 1px rgba(252, 211, 77)) drop-shadow(0 0 15px rgba(245, 158, 11)) drop-shadow(0 0 1px rgba(252, 211, 77))',
          },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': {
            opacity: 0.4,
            filter: 'none',
          },
        },
      },

      animation: {
        flicker: 'flicker 3s linear infinite',
      },
      // Z-index scale for consistent layering
      zIndex: {
        'content-layer': '5',
        decoration: '3',
        99: '99',
        100: '100',
      },
    },
  },
  plugins: [
    typographyPlugin,
    formsPlugin,
    plugin(function ({ addUtilities, theme }) {
      const colors = theme('colors');
      const cssVars = {};

      Object.entries(colors).forEach(([colorName, colorValue]) => {
        if (typeof colorValue === 'object') {
          Object.entries(colorValue).forEach(([shade, value]) => {
            cssVars[`--${colorName}-${shade}`] = value;
          });
        } else {
          cssVars[`--${colorName}`] = colorValue;
        }
      });

      addUtilities({
        ':root': cssVars,
      });
    }),
    plugin(({ addVariant }) => {
      addVariant('intersect', '&:not([no-intersect])');
    }),
  ],
};

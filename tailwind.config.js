// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./resources/**/*.blade.php",
        "./resources/**/*.js",
        "./resources/**/*.vue",
    ],
    theme: {
        extend: {
            // Vos autres configurations de thème ici...
            colors: {
                'brand-blue': '#00bcd4', // Cyan
                'brand-green': '#4caf50', // Vert
                'brand-dark': '#0f172a', // Bleu nuit
                'page-bg': '#f1f5f9',
            },
        },
    },
    plugins: [
        // Ajoutez ce plugin
        require('@tailwindcss/forms'),
        function({ addUtilities, theme }) {
            const colors = theme('colors');
            const colorUtilities = Object.keys(colors).reduce((acc, key) => {
                if (typeof colors[key] === 'object') {
                    Object.keys(colors[key]).forEach(shade => {
                        acc[`.stroke-${key}-${shade}`] = { stroke: colors[key][shade] };
                    });
                } else {
                    acc[`.stroke-${key}`] = { stroke: colors[key] };
                }
                return acc;
            }, {});

            addUtilities(colorUtilities);
        },
    ],
};
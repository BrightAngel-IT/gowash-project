const tintColorDark = '#FFB300'; // Amber/Gold for the premium Tuk look

export type ThemeType = {
    text: string;
    background: string;
    tint: string;
    icon: string;
    tabIconDefault: string;
    tabIconSelected: string;
    card: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    surface?: string;
    accent?: string;
};

export const Colors: { light: ThemeType; dark: ThemeType } = {
    light: {
        text: '#11181C',
        background: '#fff',
        tint: '#FFB300',
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: '#FFB300',
        card: '#F8F9FA',
        border: '#E9ECEF',
        success: '#00C853',
        warning: '#FFAB00',
        error: '#FF5252',
    },
    dark: {
        text: '#ECEDEE',
        background: '#121212',
        tint: tintColorDark,
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: tintColorDark,
        card: '#1E1E1E',
        border: '#2C2C2C',
        success: '#00E676',
        warning: '#FFD600',
        error: '#FF5252',
        accent: '#FFB300',
        surface: '#252525',
    },
};

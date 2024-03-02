import { Switch, rem, useComputedColorScheme, useMantineColorScheme, useMantineTheme } from "@mantine/core";
import { IconMoonStars, IconSun } from "@tabler/icons-react";



export default function ColorModeSwitch(props: any) {
    const theme = useMantineTheme();
    const { setColorScheme } = useMantineColorScheme({ keepTransitions: true });
    const computedColorScheme = useComputedColorScheme('dark');

    const sunIcon = (
        <IconSun
            style={{ width: rem(16), height: rem(16) }}
            stroke={2.5}
            color={theme.colors.yellow[4]}
        />
    );

    const moonIcon = (
        <IconMoonStars
            style={{ width: rem(16), height: rem(16) }}
            stroke={2.5}
            color={theme.colors.blue[6]}
        />
    );

    return <Switch size="md" color="dark.4" onLabel={sunIcon} offLabel={moonIcon} checked={computedColorScheme == 'dark'} onClick={(event) => { setColorScheme(event.currentTarget.checked ? 'dark' : 'light') }} {...props} />;
}
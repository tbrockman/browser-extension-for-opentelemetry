import { ActionIcon, Anchor, Flex, Group, Text, Tooltip } from "@mantine/core";
import { IconBrandGithubFilled, IconCoffee, IconPalette } from "@tabler/icons-react";

import './LinkSection.css'
import { config } from "~config";

type LinkSectionIconProps = {
    label: string,
    href: string,
    icon: JSX.Element
    tooltip: string,
    variant?: string,
    endElement?: JSX.Element
}

function LinkSectionIcon({ label, icon, href, tooltip, variant, endElement }: LinkSectionIconProps) {
    return (
        <Tooltip label={tooltip} withArrow color='blue.7'>
            <Anchor target='_blank' href={href} aria-label={label} display={'flex'}>
                <ActionIcon autoContrast color='blue.5' component='a' className='link-section-icon' size='lg' radius='xl' variant={variant ?? 'outline'} >
                    {icon}
                </ActionIcon>
                {endElement}
            </Anchor>
        </Tooltip>
    )
}

export default function LinkSection() {

    const links = [
        {
            label: 'Link to projects GitHub',
            href: 'https://github.com/tbrockman/browser-extension-for-opentelemetry',
            icon: <IconBrandGithubFilled />,
            tooltip: 'github'
        },
        {
            label: 'Link to project maintainer\'s website',
            href: 'https://theo.lol',
            icon: <IconPalette />,
            tooltip: 'creator'
        },
    ]

    if (process.env.PLASMO_BROWSER !== 'safari') {
        links.push({
            label: 'Link to sponsor project maintainer',
            href: 'https://github.com/sponsors/tbrockman',
            icon: <IconCoffee />,
            tooltip: 'sponsorship'
        })
    }

    const otel = {
        label: 'Link to OpenTelemetry website',
        href: 'https://opentelemetry.io',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" style={{ width: 'fit-content' }}>
            <path fill="#f5a800" d="M67.648 69.797c-5.246 5.25-5.246 13.758 0 19.008 5.25 5.246 13.758 5.246 19.004 0 5.25-5.25 5.25-13.758 0-19.008-5.246-5.246-13.754-5.246-19.004 0Zm14.207 14.219a6.649 6.649 0 0 1-9.41 0 6.65 6.65 0 0 1 0-9.407 6.649 6.649 0 0 1 9.41 0c2.598 2.586 2.598 6.809 0 9.407ZM86.43 3.672l-8.235 8.234a4.17 4.17 0 0 0 0 5.875l32.149 32.149a4.17 4.17 0 0 0 5.875 0l8.234-8.235c1.61-1.61 1.61-4.261 0-5.87L92.29 3.671a4.159 4.159 0 0 0-5.86 0ZM28.738 108.895a3.763 3.763 0 0 0 0-5.31l-4.183-4.187a3.768 3.768 0 0 0-5.313 0l-8.644 8.649-.016.012-2.371-2.375c-1.313-1.313-3.45-1.313-4.75 0-1.313 1.312-1.313 3.449 0 4.75l14.246 14.242a3.353 3.353 0 0 0 4.746 0c1.3-1.313 1.313-3.45 0-4.746l-2.375-2.375.016-.012Zm0 0" />
            <path fill="#425cc7" d="M72.297 27.313 54.004 45.605c-1.625 1.625-1.625 4.301 0 5.926L65.3 62.824c7.984-5.746 19.18-5.035 26.363 2.153l9.148-9.149c1.622-1.625 1.622-4.297 0-5.922L78.22 27.313a4.185 4.185 0 0 0-5.922 0ZM60.55 67.585l-6.672-6.672c-1.563-1.562-4.125-1.562-5.684 0l-23.53 23.54a4.036 4.036 0 0 0 0 5.687l13.331 13.332a4.036 4.036 0 0 0 5.688 0l15.132-15.157c-3.199-6.609-2.625-14.593 1.735-20.73Zm0 0" />
        </svg>,
        tooltip: 'opentelemetry.io',
        variant: 'transparent',
        endElement: <Flex>
            <Text size='xl' c='yellow.6' component="span">Open</Text>
            <Text size='xl' c='blue.6' component="span" style={{ fontWeight: 'bold' }}>Telemetry</Text>
        </Flex>
    }

    return (
        <Group className='link-section'>
            <Group flex={1} gap='xs'>
                <LinkSectionIcon {...otel} />
            </Group>
            <Group className='link-section-links' gap='lg'>
                {links.map((link) => <LinkSectionIcon {...link} key={link.tooltip} />)}
            </Group>
        </Group>
    )
}
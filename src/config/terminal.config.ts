export interface WhoamiLink {
  label: string;
  url: string;
}

export interface WhoamiConfig {
  displayName: string;
  bio: string[];
  links: WhoamiLink[];
}

export interface ProjectEntry {
  name: string;
  description: string;
}

export interface CustomCommand {
  name: string;
  output: string;
}

export interface BuiltinCommandConfig {
  id: string;          // internal id, never changes
  name: string;        // invoke name shown in help and matched on input
  description: string; // shown in help
  enabled: boolean;
}

export interface TerminalConfig {
  siteTitle: string;
  siteIconUrl: string;
  username: string;
  hostname: string;
  icpNumber: string;
  copyrightText: string;  // shown centered in terminal title bar
  dotArt: string;
  bannerArt: string;
  nameLines: string[];
  whoami: WhoamiConfig;
  projects: ProjectEntry[];
  customCommands: CustomCommand[];
  builtinCommands: BuiltinCommandConfig[];
  showSiteInfo: boolean;
  siteStartDate: string;
  siteInfoTemplate: string;
  showDotArt: boolean;
  showBanner: boolean;
  showName: boolean;
  adminCommand: string;
  blogCommand: string;
  postsPerPage: number;
}

export const defaultConfig: TerminalConfig = {
  siteTitle: "My Blog",
  siteIconUrl: '/icon_64.png',
  username: 'visitor',
  hostname: 'example.com',
  icpNumber: '',
  copyrightText: '',

  dotArt: `                                   .     ..
                                 .... .:: .....
                               ... .. :*=  .........
                               ..  ...   . ...:::::::.
                             ... ............
                           .  .............
                         .................
                     ....:::::::...:....::.
                   ..::::::::::......:::::.
                  ...:-:::::..........::::.
                 ..:::.................:...
               ...........................
             .............................
           .....:........................
           ...::.......................
        ....:........................
       ............................
    .....................  ....
   ...  .........  ....    ....
      .........     ..
     ........        ..       .
  ..........          ..       ..
 ..........            ...      .......
....   ..          ..     ....     ..`,

  bannerArt: `▓▓╗  ▓▓╗▓▓╗▓▓▓▓▓▓╗ ▓▓╗▓▓╗  ▓▓╗▓▓╗    ▓▓▓▓▓▓╗  ▓▓╗
▓▓║  ▓▓║▓▓║▓▓╔══▓▓╗▓▓║▓▓║ ▓▓╔╝▓▓║    ╚════▓▓╗▓▓▓║
▓▓▓▓▓▓▓║▓▓║▓▓▓▓▓▓╔╝▓▓║▓▓▓▓▓╔╝ ▓▓║     ▓▓▓▓▓╔╝╚▓▓║
▓▓╔══▓▓║▓▓║▓▓╔══▓▓╗▓▓║▓▓╔═▓▓╗ ▓▓║    ▓▓╔═══╝  ▓▓║
▓▓║  ▓▓║▓▓║▓▓▓▓▓▓╔╝▓▓║▓▓║  ▓▓╗▓▓║    ▓▓▓▓▓▓▓╗ ▓▓║
╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝    ╚══════╝ ╚═╝`,

  nameLines: [
    '',
    '  Replace this with your own name story.',
    ' ',
    '  You can edit this in the admin panel under NAME COMMAND,',
    '  or directly in src/config/terminal.config.ts.',
    '',
  ],

  whoami: {
    displayName: 'your-name',
    bio: [
      '  A developer who writes code and thinks.',
      '  Interested in systems, language, and design.',
    ],
    links: [
      { label: 'github', url: 'https://github.com/your-username' },
      { label: 'email',  url: 'mailto:you@example.com' },
    ],
  },

  projects: [
    {
      name: 'this-blog',
      description: 'Terminal-style blog built with Astro 6 + Tailwind v4',
    },
  ],

  customCommands: [],
  builtinCommands: [
    { id: 'name',     name: 'name',     description: '— how to refer to the author', enabled: true },
    { id: 'whoami',   name: 'whoami',   description: '— about the author',           enabled: true },
    { id: 'blog',     name: 'blog',     description: '— list recent posts',          enabled: true },
    { id: 'rss',      name: 'rss',      description: '— subscribe to the feed',      enabled: true },
    { id: 'projects', name: 'projects', description: '— showcase projects',          enabled: true },
    { id: 'search',   name: 'search',   description: '— search posts',               enabled: true },
  ],
  showSiteInfo: true,
  siteStartDate: '2025-01-01',
  siteInfoTemplate: 'Running for {uptime} days.\n{posts} blog posts archived, totaling {words} words.\nLast updated on {last_update}.',
  showDotArt: false,
  showBanner: true,
  showName: true,
  adminCommand: 'sudo admin',
  blogCommand: 'sudo blog',
  postsPerPage: 10,
};

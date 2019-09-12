<p align="center" style="text-align: center;">
  <a href="https://super-productivity.com/">
    <img align="center" alt="Logo" src="build/icons/128x128.png" width="128px"/>
  </a>
  <h1 align="center">Super Productivity</h1>
</p>

<p align="center" style="text-align: center;">
  <a href="https://snapcraft.io/superproductivity">
    <img alt="Get it from the Snap Store" src="https://snapcraft.io/static/images/badges/en/snap-store-black.svg" align="center" height="36">
  </a>
  <a href="//www.microsoft.com/store/apps/9nhfvg8361tw?cid=storebadge&ocid=badge'><img src='https://assets.windowsphone">
    <img alt="English badge" src="https://assets.windowsphone.com/13484911-a6ab-4170-8b7e-795c1e8b4165/English_get_L_InvariantCulture_Default.png" align="center" height="36">
  </a>
  <a href="https://lbesson.mit-license.org">
    <img alt="MIT license" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" align="center">
  </a>
  <a href="https://github.com/johannesjo/super-productivity/releases">
    <img alt="GitHub All Releases" src="https://img.shields.io/github/downloads/johannesjo/super-productivity/total" align="center">
  </a>
  <a href="https://www.reddit.com/r/selfhosted/comments/by7bcu/super_productivity_is_an_open_source_todo_list/?ref=readnext">
    <img alt="On reddit" src="https://img.shields.io/badge/on-reddit-orange.svg?style=flat-square" align="center">
  </a>
  <a href="https://www.producthunt.com/posts/super-productivity">
    <img alt="On product hunt" src="https://img.shields.io/badge/on-product%20hunt-blue.svg?style=flat-square" align="center">
  </a>
  <a href="https://www.producthunt.com/posts/super-productivity">
    <img alt="On Indie Hackers" src="https://img.shields.io/badge/on-indie%20hackers-blue?style=flat-square" align="center">
  </a>
  <a href="https://twitter.com/intent/tweet?text=Super%20Productivity%20%20https%3A%2F%2Fsuper-productivity.com">
    <img alt="tweet" src="https://img.shields.io/twitter/url/https/github.com/ArmynC/ArminC-AutoExec.svg?style=flat-square&logo=twitter" target="_blank" align="center" />
  </a>


Organize your daily tasks at one place while making time tracking a lot less annoying. Super Productivity is a ToDo List / Time Tracker / Personal Jira Task Manager for Linux, MacOS and Windows aimed at reducing the time you spend with repetitive tasks and to provide you with a place to collect all the information you need to do your job.

<p align="center"><a href="http://super-productivity.com">:globe_with_meridians: Open Web App</a> or <a href="https://github.com/johannesjo/super-productivity/releases">:computer: Download</a></p>

## :heavy_check_mark: Features
* **Plan, track & summarize**. Create time sheets and work summaries in a breeze to easily export them to your companies time tracking system.
* Integrate with **Jira** and **Github**. Auto import tasks assigned to you, plan the details locally, automatically create worklogs and get notified right away, when something changes.
* Organize your project's data. Create **notes**, attach **files** or create **bookmarks** for links, files and even commands and have it all out of the way, once you're ready for the weekend.
* Helps you to **establish healthy habits**. A break timer reminds to you, when it's time to step away. You also can collect personal metrics for yourself to see, which of your work routines need adjustments.
* Stuck and procrastinating? No problem! Super Productivity's **anti procrastination** feature helps you to reconsider your options and a **pomodoro timer** is also always at hand.
* Super Productivity **does NOT collect any data** and there are no user accounts or registration. It's **free** and **open source** and always will be.

And much more!


<a href="https://www.youtube.com/watch?v=VoF2_RSdNXA"><img alt="Work View with global links" src="screens/screen_standard.png" width="100%"></a>

## :question: How to use it
I wrote [a little article](https://dev.to/johannesjo/super-productivity-how-to-grow-fond-of-time-tracking-and-task-management-22ee) on how I use the app. There is also [a youtube video available](https://www.youtube.com/watch?v=VoF2_RSdNXA).

## :globe_with_meridians: Web Version
Check out the It is a little bit more limited (time tracking only works if the app is open and idle time tracking is disabled).

If you want the Jira Integration to work you have also to download and install the [Super Productivity Chrome Extension](https://chrome.google.com/webstore/detail/super-productivity/ljkbjodfmekklcoibdnhahlaalhihmlb).

## :computer: Downloads & Install
### All Platforms
[Install from the releases page](https://github.com/johannesjo/super-productivity/releases).

### Windows
Due to certification issues it's recommended to download from the Microsoft Store:

<a href='//www.microsoft.com/store/apps/9nhfvg8361tw?cid=storebadge&ocid=badge'><img src='https://assets.windowsphone.com/13484911-a6ab-4170-8b7e-795c1e8b4165/English_get_L_InvariantCulture_Default.png' alt='English badge' width="127" height="52"/></a>

### Linux
```
# stable
sudo snap install superproductivity

# edge channel releases
 sudo snap install --channel=beta superproductivity
```
<a href="https://snapcraft.io/superproductivity">
  <img alt="Get it from the Snap Store" src="https://snapcraft.io/static/images/badges/en/snap-store-black.svg" />
</a>

### MacOS
Install via [homebrew cask](https://github.com/caskroom/homebrew-cask) (project might not always be up to date):
```
brew cask install superProductivity
```

## Setup WebDAV Syncing
When starting the app via the command line the path to where emergency backups are saved is printed out to the command line. Just take away the `/backup` sub folder from the path and use the remaining path to sync via the cloud.

## :hearts: Contributing
There are several ways to help. Publishing a bug or a feature request is a good first step. Also making it more popular by posting it on social media etc. is great, because it means more users, which in turn leads to more people testing the app and also more people contributing code.

**Pull requests** are of course also very welcome. Please make sure that you're following the [angular commit guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#commits) and to also include the issue number in your commit message, if you're fixing a particular issue (e.g.: `feat: add nice feature with the number #31`).

### Running the development server
To run the development server you need to have node installed at least in the version 10. Go to https://nodejs.org for installation instructions.

**Clone repo**
```
git clone https://github.com/johannesjo/super-productivity.git
```
**Install dependencies**
```
cd super-productivity
npm install
npm install -g @angular/cli
```
**Run the dev server**
```
ng serve
```
Afterwards you can open http://localhost:4200 in your browser. For most adjustments this should be enough and also enables you to use the [redux dev tools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=de). 

If you want to run the app standalone do the following:
```
ng serve

# in a new console tab
npm start
```

### Packaging the app
Packaging the app is done via [electron-builder](https://github.com/electron-userland/electron-builder). To start packaging run `yarn dist`. If you want to add new platforms and experiment with the build options the easiest way to do so is manipulating the `build` property in the [package.json](https://github.com/johannesjo/super-productivity/blob/develop/package.json), but you can also use the [command line interface of electron builder](https://www.electron.build/cli).

## :sparkling_heart: Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/johannesjo"><img src="https://avatars1.githubusercontent.com/u/1456265?v=4" width="100px;" alt="Johannes Millan"/><br />
    </a></td>
    <td align="center"><a href="https://github.com/theCalcaholic"><img src="https://avatars1.githubusercontent.com/u/6317548?v=4" width="100px;" alt="Tobias K"/>
    </a></td>
    <td align="center"><a href="https://github.com/KonTy"><img src="https://avatars0.githubusercontent.com/u/9524513?v=4" width="100px;" alt="KonTy"/>
    </a><a href="#ideas-KonTy" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/aitboudad"><img src="https://avatars2.githubusercontent.com/u/1753742?v=4" width="100px;" alt="Abdellatif Ait boudad"/>
    </a></td>
    <td align="center"><a href="https://github.com/Morganamilo"><img src="https://avatars2.githubusercontent.com/u/16593899?v=4" width="100px;" alt="Anna"/>
    </a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

# SWE4713 - Application Domain
## Double Entry Accounting Syste

### To get started
- Install NodeJS from [https://nodejs.org](https://nodejs.org). The LTS version is fine
- Clone this repo
- Run `npm run update` to install the packages
- Run `npm run build` to build the TypeScript into Javascript
- Run `npm start` to start the server
- Point your browser at [http://localhost:8080](http://localhost:8080) to load the page

### To develop
- Download and install Visual Studio Code from [http://code.visualstudio.com/](http://code.visualstudio.com/)
- Open this repo in Visual Studio Code
- The views are located in the `views/` folder, the rest of the source (models and controllers) are in the `source/` folder
- After making modifications to the TypeScript, you have to transpile it to Javascript. To do this, press `Cmd + Shift + B` (on MacOS) or `Ctrl + Shift + B` (on Windows/Linux)
- You can run the code in the integrated debugger by pressing `F5`. After you transpile the TypeScript, you must restart the application
- Once your changes are made, push them to the `develop` branch and open a Pull Request to merge them into the `master` branch
- The code will auto-deploy on a successful merge into `master`
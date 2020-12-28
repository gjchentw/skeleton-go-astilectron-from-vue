const join = require("path").join;

module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        asar: true,
        appId: 'dev.electron.app',
        productName: 'ElectronApp',
        artifactName: '${productName}-${version}-${arch}.${ext}',
        extraResources: [
          join('bin', 'main.exe')
        ],
        win: {
          //icon: 'public/favicon.ico',
          target: [{
            target: 'nsis',
            arch: ['x64']
          }]
        },
        dmg: {
          //icon: 'public/favicon.ico'
        },
        linux: {
          //icon: 'public/favicon.ico'
        },
        mac: {
          //icon: 'public/favicon.ico'
        },
        nsis: {
          oneClick: true,
          //installerIcon: 'public/favicon.ico',
          //uninstallerIcon: 'public/favicon.ico',
          //installerHeaderIcon: 'public/favicon.ico',
        }
      }
    }
  }
}

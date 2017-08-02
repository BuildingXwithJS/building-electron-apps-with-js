// plugins
import Crunchyroll from './crunchyroll/index';
import Youtube from './youtube/index';

// manager
import PluginManager from './manager';

export default new PluginManager([Crunchyroll]); //, Youtube]);

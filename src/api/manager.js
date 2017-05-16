// main module
export default class PluginManager {
  constructor(plugins) {
    this.plugins = plugins;
  }

  async getAllSeries(page = 0) {
    const results = await Promise.all(this.plugins.map(plugin => plugin.getAllSeries(page)));
    return results.reduce((prev, curr) => prev.concat(curr), []);
  }

  async getEpisodes(series) {
    const plugin = this.plugins.find(p => p.id === series.source);
    return plugin.getEpisodes(series);
  }

  async getEpisode(episode) {
    const plugin = this.plugins.find(p => p.id === episode.source);
    return plugin.getEpisode(episode);
  }

  async getMySeries() {
    const results = await Promise.all(this.plugins.map(plugin => plugin.getMySeries()));
    return results.reduce((prev, curr) => prev.concat(curr), []);
  }

  async search(query) {
    const results = await Promise.all(this.plugins.map(plugin => plugin.search(query)));
    return results.reduce((prev, curr) => prev.concat(curr), []);
  }

  drawSettings() {
    return this.plugins.map(plugin => plugin.drawSettings());
  }
}

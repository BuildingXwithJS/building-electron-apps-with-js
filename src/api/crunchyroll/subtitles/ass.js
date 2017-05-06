/**
 * Code adapted from https://github.com/Deathspike/crunchyroll.js under MIT
 */
// our packages
import parseXml from '../parseXml';

/**
 * Converts the event block.
 */
const eventFormat = 'Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text';
const event = block =>
  `[Events]
Format: ${eventFormat}
${[]
    .concat(block.event)
    .map(
      style =>
        `Dialogue: 0,` +
        `${style.$.start},${style.$.end},'${style.$.style},${style.$.name},${style.$.margin_l},` +
        `${style.$.margin_r},${style.$.margin_v},${style.$.effect},${style.$.text}`
    )
    .join('\n')}
`;

/**
 * Converts the script block.
 */
const script = block =>
  `[Script Info]
Title: ${block.$.title}
ScriptType: v4.00+
WrapStyle: ${block.$.wrap_style}
PlayResX: ${block.$.play_res_x}
PlayResY: ${block.$.play_res_y}
Subtitle ID: ${block.$.id}
Language: ${block.$.lang_string}
Created: ${block.$.created}
`;

/**
 * Converts the style block.
 */
const styleFormat = 'Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,' +
  'OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,' +
  'ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,' +
  'MarginL,MarginR,MarginV,Encoding';
const style = block =>
  `[V4+ Styles]
Format: ${styleFormat}
${[]
    .concat(block.style)
    .map(
      st =>
        `Style: ` +
        `${st.$.name},${st.$.font_name},${st.$.font_size},${st.$.primary_colour},` +
        `${st.$.secondary_colour},${st.$.outline_colour},${st.$.back_colour},` +
        `${st.$.bold},${st.$.italic},${st.$.underline},${st.$.strikeout},` +
        `${st.$.scale_x},${st.$.scale_y},${st.$.spacing},${st.$.angle},` +
        `${st.$.border_style},${st.$.outline},${st.$.shadow},${st.$.alignment},` +
        `${st.$.margin_l},${st.$.margin_r},${st.$.margin_v},${st.$.encoding}`
    )
    .join('\n')}
`;

/**
 * Converts an input buffer to a SubStation Alpha subtitle.
 */
export default async input => {
  const xml = await parseXml(input.toString(), {
    explicitArray: false,
    explicitRoot: false,
  });

  return `${script(xml)}
${style(xml.styles)}
${event(xml.events)}`;
};

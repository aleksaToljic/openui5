sap.ui.define(['sap/ui/webc/common/thirdparty/base/asset-registries/Themes', 'sap/ui/webc/common/thirdparty/theming/generated/themes/sap_fiori_3/parameters-bundle.css', './sap_fiori_3/parameters-bundle.css'], function (Themes, defaultThemeBase, parametersBundle_css) { 'use strict';

	function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e['default'] : e; }

	var defaultThemeBase__default = /*#__PURE__*/_interopDefaultLegacy(defaultThemeBase);

	Themes.registerThemePropertiesLoader("@ui5/webcomponents-theming", "sap_fiori_3", () => defaultThemeBase__default);
	Themes.registerThemePropertiesLoader("@ui5/webcomponents", "sap_fiori_3", () => parametersBundle_css);
	var cardHeaderCss = {packageName:"@ui5/webcomponents",fileName:"themes/CardHeader.css",content:".ui5-hidden-text{position:absolute;clip:rect(1px,1px,1px,1px);user-select:none;left:-1000px;top:-1000px;pointer-events:none;font-size:0}.ui5-card-header{position:relative;display:flex;align-items:center;padding:var(--_ui5_card_content_padding);outline:none}:host([subtitleText]) .ui5-card-header{align-items:flex-start}.ui5-card-header:focus:before{outline:none;content:\"\";position:absolute;border:var(--_ui5_card_header_focus_border);pointer-events:none;top:var(--_ui5_card_header_focus_offset);left:var(--_ui5_card_header_focus_offset);right:var(--_ui5_card_header_focus_offset);bottom:var(--_ui5_card_header_focus_offset);border-top-left-radius:var(--_ui5_card_header_focus_radius);border-top-right-radius:var(--_ui5_card_header_focus_radius);border-bottom-left-radius:var(--_ui5_card_header_focus_bottom_radius);border-bottom-right-radius:var(--_ui5_card_header_focus_bottom_radius)}.ui5-card-header.ui5-card-header--interactive:hover{cursor:pointer;background:var(--_ui5_card_header_hover_bg)}.ui5-card-header.ui5-card-header--active,.ui5-card-header.ui5-card-header--interactive:active{background:var(--_ui5_card_header_active_bg)}.ui5-card-header .ui5-card-header-text{flex:1;pointer-events:none}.ui5-card-header .ui5-card-header-avatar{height:3rem;width:3rem;display:flex;align-items:center;justify-content:center;margin-right:.75rem;pointer-events:none}::slotted([ui5-icon]){width:1.5rem;height:1.5rem;color:var(--sapTile_IconColor)}::slotted(img[slot=avatar]){width:100%;height:100%;border-radius:50%}.ui5-card-header .ui5-card-header-status{display:inline-block;font-family:\"72override\",var(--sapFontFamily);font-size:var(--sapFontSmallSize);color:var(--sapTile_TextColor);text-align:left;line-height:1.125rem;padding-left:1rem;margin-left:auto;text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.ui5-card-header .ui5-card-header-text .ui5-card-header-title{font-family:var(--_ui5_card_header_title_font_family);font-size:var(--_ui5_card_header_title_font_size);font-weight:var(--_ui5_card_header_title_font_weight);color:var(--sapTile_TitleTextColor);max-height:3.5rem}.ui5-card-header .ui5-card-header-text .ui5-card-header-subtitle{font-family:\"72override\",var(--sapFontFamily);font-size:var(--sapFontSize);font-weight:400;color:var(--sapTile_TextColor);margin-top:.5rem;max-height:2.1rem}.ui5-card-header .ui5-card-header-text .ui5-card-header-subtitle,.ui5-card-header .ui5-card-header-text .ui5-card-header-title{text-align:left;text-overflow:ellipsis;white-space:normal;word-wrap:break-word;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical;display:-webkit-box;max-width:100%}[dir=rtl].ui5-card-header .ui5-card-header-avatar{margin-left:.75rem;margin-right:0}[dir=rtl].ui5-card-header .ui5-card-header-status{padding-right:1rem;padding-left:0;margin-right:auto}[dir=rtl].ui5-card-header .ui5-card-header-text .ui5-card-header-title{text-align:right}[dir=rtl].ui5-card-header .ui5-card-header-text .ui5-card-header-subtitle{text-align:right}"};

	return cardHeaderCss;

});

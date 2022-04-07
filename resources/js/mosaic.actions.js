// This plugin is used to register and execute actions.
import $ from "jquery";
import Modal from "mockup/src/pat/modal/modal";
import Tile from "./mosaic.tile";
import utils from "mockup/src/core/utils";
import "./mosaic.overlay";
import "jquery-form";
import "select2";

const log = logging.getLogger("pat-mosaic/actions");

class ActionManager {
    constructor(mosaic) {
        this.mosaic = mosaic;
        this.actions = []; // Array with all the actions
        this.shortcuts = []; // Lookup array for shortcuts
    }

    registerAction (name, options) {
        var self = this;
        // Extend default settings
        options = $.extend(
            {
                // Handler for executing the action
                exec: function () { },

                // Shortcut can be any key + ctrl/shift/alt or a combination of
                // those
                shortcut: {
                    ctrl: false,
                    alt: false,
                    shift: false,
                    key: "",
                },

                // Method to see if the actions should be visible based on the
                // current tile state
                visible: function (tile) {
                    return true;
                },
            },
            options
        );

        // Add action to manager
        self.actions[name] = options;

        // Check if shortcut is defined
        if (options.shortcut.key !== "") {
            // Set keyCode and charCode
            options.shortcut.charCode = options.shortcut.key.toUpperCase().charCodeAt(0);
            options.shortcut.action = name;

            // Set shortcut
            self.shortcuts.push(options.shortcut);
        }
    }

    execAction (action, source) {
        var self = this;
        if(!(action in self.actions)) {
            log.error(`Action ${action} not in ${self.actions}`);
            return
        }
        return self.actions[action].exec(source);
    }

    getPrefixedClassName (name) {
        if (name.indexOf("-") > -1) {
            // dash-spaced-class-name
            return "mosaic-" + name;
        } else {
            // camelCaseClassName
            return "mosaic" + name.charAt(0).toUpperCase() + name.slice(1);
        }
    };

    async initActions () {
        var self = this;
        var mosaic = self.mosaic;

        // Register generic re-usable toggle tile class format action
        self.registerAction("tile-toggle-class", {
            exec: function () {
                var name;
                if (arguments.length > 0 && arguments[0].value) {
                    name = self.getPrefixedClassName(arguments[0].value);
                    $(".mosaic-selected-tile", mosaic.document).toggleClass(name);
                }
            },
        });

        // Register generic re-usable toggle tile class format action
        self.registerAction("tile-remove-format", {
            exec: function () {
                var i, j, group, action, name;
                for (i = 0; i < mosaic.options.formats.length; i++) {
                    group = mosaic.options.formats[i];
                    for (j = 0; j < group.actions.length; j++) {
                        action = group.actions[j];
                        if (action.category === "tile") {
                            name = self.getPrefixedClassName(action.name);
                            $(".mosaic-selected-tile", mosaic.document).removeClass(name);
                        }
                    }
                }
            },
        });

        // Register generic re-usable toggle row class format action
        self.registerAction("row-toggle-class", {
            exec: function () {
                var name;
                if (arguments.length > 0 && arguments[0].value) {
                    name = self.getPrefixedClassName(arguments[0].value);
                    $(".mosaic-selected-tile", mosaic.document)
                        .parents(".mosaic-grid-row")
                        .first()
                        .toggleClass(name);
                }
            },
        });

        // Register generic re-usable toggle row class format action
        self.registerAction("row-remove-format", {
            exec: function () {
                var i, j, group, action, name;
                for (i = 0; i < mosaic.options.formats.length; i++) {
                    group = mosaic.options.formats[i];
                    for (j = 0; j < group.actions.length; j++) {
                        action = group.actions[j];
                        if (action.category === "row") {
                            name = self.getPrefixedClassName(action.name);
                            $(".mosaic-selected-tile", mosaic.document)
                                .parents(".mosaic-grid-row")
                                .first()
                                .removeClass(name)
                                .removeClass(action.name);
                        }
                    }
                }
            },
        });

        // Register tile align block action
        self.registerAction("tile-align-block", {
            exec: function () {
                // Remove left and right align classes
                $(".mosaic-selected-tile", mosaic.document)
                    .removeClass("mosaic-tile-align-right")
                    .removeClass("mosaic-tile-align-left");
            },
            shortcut: {
                ctrl: true,
                alt: false,
                shift: true,
                key: "b",
            },
        });

        // Register tile align left action
        self.registerAction("tile-align-left", {
            exec: function () {
                // Remove right align class, add left align class
                $(".mosaic-selected-tile", mosaic.document)
                    .removeClass("mosaic-tile-align-right")
                    .addClass("mosaic-tile-align-left");
            },
            shortcut: {
                ctrl: true,
                alt: false,
                shift: true,
                key: "l",
            },
        });

        // Register tile align right action
        self.registerAction("tile-align-right", {
            exec: function () {
                // Remove left align class, add right align class
                $(".mosaic-selected-tile", mosaic.document)
                    .removeClass("mosaic-tile-align-left")
                    .addClass("mosaic-tile-align-right");
            },
            shortcut: {
                ctrl: true,
                alt: false,
                shift: true,
                key: "r",
            },
        });

        // Register save action
        self.registerAction("save", {
            exec: function () {
                mosaic.saving = true;
                self.blurSelectedTile();
                mosaic.toolbar.SelectedTileChange();
                mosaic.queue(function (next) {
                    mosaic.layoutManager.saveLayoutToForm();
                    $("#form-buttons-save").trigger("click");
                    mosaic.saving = false;
                    next();
                });
            },
            shortcut: {
                ctrl: true,
                alt: false,
                shift: false,
                key: "s",
            },
        });

        // Register cancel action
        self.registerAction("cancel", {
            exec: function () {
                // Cancel form
                $("#form-buttons-cancel").trigger("click");
            },
        });

        // Register preview action
        self.registerAction("preview", {
            exec: function () {
                // Trigger validation => drafting sync
                $(
                    "#form-widgets-ILayoutAware-customContentLayout, " +
                    "[name='form.widgets.ILayoutAware.customContentLayout']"
                )
                    .trigger("focus")
                    .trigger("blur");

                // Layout preview
                setTimeout(function () {
                    window.open(
                        mosaic.options.context_url + "/@@layout_preview",
                        "_blank"
                    );
                }, 1000);
            },
        });

        // Register html action
        self.registerAction("html", {
            exec: function () {
                // Local variables
                var tilecontent, text, height;

                // Get tile content div
                tilecontent = $(".mosaic-selected-tile", mosaic.document).children(
                    ".mosaic-tile-content"
                );

                // Check if not already html editable
                if (tilecontent.find(".mosaic-rich-text-textarea").length === 0) {
                    // Add new text area and set content
                    text = tilecontent.html();
                    height = tilecontent.height();
                    tilecontent.empty();
                    tilecontent.prepend(
                        $(mosaic.document.createElement("textarea"))
                            .addClass("mosaic-rich-text-textarea")
                            .html($.trim(text))
                            .height(height)
                    );
                }
            },
        });

        // Register page properties action
        self.registerAction("properties", {
            exec: function () {
                mosaic.overlay.open("all");
            },
        });

        self.registerAction("layout", {
            /* layout drop down */
            exec: function () {
                var $container = $(".mosaic-button-group-layout");
                $container.toggleClass("active");
            },
            visible: function () {
                return true;
            },
        });

        // register customize layout button
        self.registerAction("customizelayout", {
            exec: function () {
                mosaic.setSelectedContentLayout(""); // clear selected layout, will use stored layout then
                $(".mosaic-toolbar-secondary-functions").removeClass("d-none");
                $(".mosaic-button-customizelayout").hide();
                $(".mosaic-button-savelayout").show();
                // go through each tile and add movable
                $(".mosaic-panel .mosaic-tile", mosaic.document).each(function () {
                    var tile = new Tile(mosaic, this);
                    tile.makeMovable();
                    tile.$el.mosaicAddDrag();
                });
                $(".mosaic-button-group-layout").removeClass("active");
            },
            visible: function () {
                return mosaic.options.canChangeLayout;
            },
        });

        // register change layout button
        self.registerAction("changelayout", {
            exec: function () {
                var yes = mosaic.hasContentLayout;
                if (!yes) {
                    yes = confirm(
                        "Changing your layout will destroy all existing custom layout " +
                        "settings you have in place. Are you sure you want to continue?"
                    );
                }
                if (yes) {
                    mosaic.selectLayout();
                }
                $(".mosaic-button-group-layout").removeClass("active");
            },
            visible: function () {
                return mosaic.options.available_layouts.length > 0;
            },
        });

        // register change layout button
        self.registerAction("savelayout", {
            exec: function () {
                mosaic.saveLayout();
                $(".mosaic-button-group-layout").removeClass("active");
            },
            visible: function () {
                return true;
            },
        });

        // Register add tile action
        self.registerAction("add-tile", {
            exec: function () {
                // Open overlay
                var m = new Modal($(".mosaic-toolbar"), {
                    ajaxUrl: mosaic.options.context_url +
                        "/@@add-tile?form.button.Create=Create",
                });
                m.show();
            },
        });

        // Register format action
        self.registerAction("format", {
            exec: function (source) {
                // Execute the action
                self.execAction($(source).val());
                // Reset menu
                $(source).select2("val", "none");
            },
        });

        // Register page-insert action
        self.registerAction("insert", {
            exec: function (source) {
                // Local variables
                var tile_config, tile_group, tile_type, x, y;

                // Check if value selected
                if ($(source).val() === "none") {
                    return false;
                } else {
                    tile_type = $(source).val();
                }

                // Deselect tiles
                self.blurSelectedTile()

                // Set actions
                mosaic.toolbar.SelectedTileChange();

                // Get tile config
                for (x = 0; x < mosaic.options.tiles.length; x += 1) {
                    tile_group = mosaic.options.tiles[x];
                    for (y = 0; y < tile_group.tiles.length; y += 1) {
                        if (tile_group.tiles[y].name === tile_type) {
                            tile_config = tile_group.tiles[y];
                        }
                    }
                }

                // Create new app tile
                if (tile_config.tile_type === "textapp") {
                    // an app tile
                    // generate uid for it: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
                    var uid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
                        /[xy]/g,
                        function (c) {
                            var r = (Math.random() * 16) | 0, v = c == "x" ? r : (r & 0x3) | 0x8;
                            return v.toString(16);
                        }
                    );

                    var tileUrl = mosaic.options.context_url + "/@@" + tile_type + "/" + uid;
                    var html = "<html><body>" +
                        mosaic.layoutManager.getDefaultValue(tile_config) +
                        "</body></html>";
                    mosaic.layoutManager.addAppTileHTML(tile_type, html, tileUrl);
                } else if (tile_config.tile_type === "app") {
                    // Load add form form selected tiletype
                    var initial = true;
                    utils.loading.show();
                    $.ajax({
                        type: "GET",
                        url: mosaic.options.context_url +
                            "/@@add-tile?tiletype=" +
                            tile_type +
                            "&form.button.Create=Create",
                        success: function (value, xhr) {
                            utils.loading.hide();
                            var $value, action_url, authenticator, modalFunc;

                            // Read form
                            $value = $(value);
                            action_url = $value.find("#add_tile").attr("action");
                            authenticator = $value.find('[name="_authenticator"]').val();
                            // Open add form in modal when requires user input
                            modalFunc = function (html) {
                                mosaic.overlay.app = new Modal($(".mosaic-toolbar"), {
                                    html: html,
                                    loadLinksWithinModal: true,
                                    buttons: '.formControls > button[type="submit"], .actionButtons > button[type="submit"]',
                                });
                                mosaic.overlay.app.$el.off("after-render");
                                mosaic.overlay.app.on("after-render", function (event) {
                                    /* Remove field errors since the user has not actually
                                        been able to fill out the form yet
                                    */
                                    if (initial) {
                                        $(
                                            ".field.error",
                                            mosaic.overlay.app.$modal
                                        ).removeClass("error");
                                        $(
                                            ".fieldErrorBox,.portalMessage",
                                            mosaic.overlay.app.$modal
                                        ).remove();
                                        initial = false;
                                    }

                                    $('input[name*="cancel"]', mosaic.overlay.app.$modal)
                                        .off("click")
                                        .on("click", function () {
                                            // Close overlay
                                            mosaic.overlay.app.hide();
                                            mosaic.overlay.app = null;
                                        });
                                });
                                mosaic.overlay.app.show();
                                mosaic.overlay.app.$el.off("formActionSuccess");
                                mosaic.overlay.app.on(
                                    "formActionSuccess",
                                    function (event, response, state, xhr) {
                                        var tileUrl = xhr.getResponseHeader("X-Tile-Url");
                                        if (tileUrl) {
                                            mosaic.layoutManager.addAppTileHTML(
                                                tile_type,
                                                response,
                                                tileUrl
                                            );
                                            mosaic.overlay.app.hide();
                                            mosaic.overlay.app = null;
                                        }
                                    }
                                );
                            };

                            // Auto-submit add-form when all required fields are filled
                            if ($("form .required", $value).filter(function () {
                                var val = $(this)
                                    .parents(".field")
                                    .first()
                                    .find("input, select, textarea")
                                    .not('[type="hidden"]')
                                    .last()
                                    .val();
                                return val === null || val.length === 0;
                            }).length > 0) {
                                modalFunc(value);
                            } else if (action_url) {
                                $("form", $value).ajaxSubmit({
                                    type: "POST",
                                    url: action_url,
                                    data: {
                                        "buttons.save": "Save",
                                        "_authenticator": authenticator,
                                    },
                                    success: function (value, state, xhr) {
                                        var tileUrl = xhr.getResponseHeader("X-Tile-Url");
                                        if (tileUrl) {
                                            mosaic.layoutManager.addAppTileHTML(
                                                tile_type,
                                                value,
                                                tileUrl
                                            );
                                        } else {
                                            modalFunc(value);
                                        }
                                    },
                                });
                            }
                        },
                    });
                } else {
                    // Add tile
                    mosaic.layoutManager.addTile(tile_type, mosaic.layoutManager.getDefaultValue(tile_config));
                }

                // Reset menu
                $(source).select2("val", "none");

                // Normal exit
                return true;
            },
        });

        // Handle keypress event, check for shortcuts
        $(document).on("keypress", function (e) {
            // Action name
            var action = "";

            // Loop through shortcuts
            $(mosaic.actionManager.shortcuts).each(function () {
                // Check if shortcut matched
                if ((e.ctrlKey === this.ctrl ||
                    (navigator.userAgent.toLowerCase().indexOf("macintosh") !== -1 &&
                        e.metaKey === this.ctrl)) &&
                    (e.altKey === this.alt || e.altKey === undefined) &&
                    e.shiftKey === this.shift &&
                    e.charCode &&
                    String.fromCharCode(e.charCode).toUpperCase().charCodeAt(0) ===
                    this.charCode) {
                    // Found action
                    action = this.action;
                }
            });

            // Check if shortcut found
            if (action !== "") {
                // Exec actions
                mosaic.actionManager.actions[action].exec();

                // Prevent other actions
                return false;
            }

            // Normal exit
            return true;
        });
    };

    blurSelectedTile() {
        var self = this;
        $(".mosaic-selected-tile", self.mosaic.document).each(function () {
            var tile = new Tile(self.mosaic, this);
            tile.blur();
        });
    }
}

export default ActionManager;

*** Settings ***

Resource  keywords.robot

Test Setup  Setup Mosaic Example Page
Test Teardown  Plone test teardown


*** Test Cases ***

Show how Mosaic editor is opened
    Go to  ${PLONE_URL}/example-document
    Wait Until Element Is Visible  id=contentview-edit
    Highlight  id=contentview-edit
    Capture Page Screenshot
    ...  mosaic-editor-open.png


Show the Mosaic editing capabilities
    Go to  ${PLONE_URL}/example-document/edit
    Wait Until Element Is Visible  css=.mosaic-select-layout
    Capture Page Screenshot
    ...  mosaic-editor-layout-selector.png

    # Show how to select the initial layout
    Wait until Page contains element  jquery=a[data-value="default/basic.html"]
    Highlight  jquery=a[data-value="default/basic.html"] img
    Capture Page Screenshot
    ...  mosaic-editor-layout-selector-select.png

    ## XXX: Only double click worked on Firefox 52
    Click element  jquery=a[data-value="default/basic.html"]
    # Double click element  jquery=a[data-value="default/basic.html"]

    # Show the properties view in Mosaic editor
    Wait Until Element Is Visible  css=.mosaic-toolbar
    Click element  css=.mosaic-button-properties

    Wait Until Element Is Visible  css=.modal-body form .autotoc-nav
    Highlight  css=.modal-body form .autotoc-nav

    Capture Page Screenshot
    ...  mosaic-editor-properties-modal.png

    Click element  css=.pattern-modal-buttons #form-buttons-save

    Wait Until Element is not visible  css=.pattern-modal-buttons #form-buttons-save

    # Show the Mosaic editor
    Element should be visible  css=.mosaic-toolbar-primary-functions .mosaic-button-customizelayout
    Element should not be visible  css=.mosaic-toolbar-secondary-functions

    Highlight  css=.mosaic-toolbar-primary-functions .mosaic-button-customizelayout
    Capture Page Screenshot
    ...  mosaic-editor-customize.png
    Clear highlight  css=.mosaic-toolbar-primary-functions .mosaic-button-customizelayout

    Wait for then click element  css=.mosaic-toolbar-primary-functions .mosaic-button-customizelayout

    # Show how to select a new tile from menu
    Wait Until Element Is Visible  css=.select2-container.mosaic-menu-insert
    Highlight  css=.select2-container.mosaic-menu-insert
    Click element  css=.select2-container.mosaic-menu-insert a
    Wait until element is visible  css=.mosaic-menu-insert .select2-option-irichtextbehavior-text
    Mouse over  css=.mosaic-menu-insert .select2-option-irichtextbehavior-text

    Capture Page Screenshot
    ...  mosaic-editor-select-field-text-tile.png

    Clear highlight  css=.mosaic-menu-insert

    # Show how to drag a new tile into its initial position

    Click element  css=.mosaic-menu-insert .select2-option-irichtextbehavior-text
    Wait until page contains element  css=.mosaic-helper-tile-new
    Wait until element is visible  css=.mosaic-helper-tile-new
    Update element style
    ...  css=.mosaic-IDublinCore-description-tile .mosaic-divider-bottom
    ...  display  block
    Mouse over
    ...  css=.mosaic-IDublinCore-description-tile .mosaic-divider-bottom
    Capture Page Screenshot
    ...  mosaic-editor-drag-field-text-tile.png

    # Show how to drop a new tile into its initial position

    Click element  css=.mosaic-selected-divider
    Wait Until Element Is Visible  css=.mosaic-button-save
    Highlight  css=.mosaic-button-save
    Capture Page Screenshot
    ...  mosaic-editor-drop-field-text-tile.png

    # Show how the custom layout looks after saving

    Click button  css=.mosaic-button-save
    # some people reported sporadic page unload alert ... if so, accept it
    Run keyword and ignore error  Handle Alert  action=ACCEPT  timeout=5
    Capture Page Screenshot
    ...  mosaic-page-saved.png


*** Keywords ***


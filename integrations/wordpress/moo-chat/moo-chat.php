<?php
/**
 * Plugin Name:       ChatMOO
 * Plugin URI:        https://heyitsmoo.com/
 * Description:       Adds your ChatMOO AI assistant to your WordPress site. Paste your public key and you're live — no code.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            HeyItsMOO
 * Author URI:        https://heyitsmoo.com/
 * License:           GPL-2.0-or-later
 * Text Domain:       moo-chat
 *
 * This is the thin installer: all the AI, config and data live in the ChatMOO
 * platform. This plugin only injects the embed snippet with your public key.
 *
 * @package MOO_Chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MOO_CHAT_DEFAULT_APP_URL', 'https://app.heyitsmoo.com' );

/**
 * Settings.
 */
function moo_chat_default_options() {
	return array(
		'public_key' => '',
		'app_url'    => MOO_CHAT_DEFAULT_APP_URL,
		'enabled'    => 1,
	);
}

function moo_chat_get_options() {
	$opts = get_option( 'moo_chat_options', array() );
	return wp_parse_args( is_array( $opts ) ? $opts : array(), moo_chat_default_options() );
}

/**
 * Inject the embed snippet on the front end.
 */
function moo_chat_enqueue() {
	if ( is_admin() ) {
		return;
	}
	$o = moo_chat_get_options();
	if ( empty( $o['enabled'] ) || '' === trim( $o['public_key'] ) ) {
		return;
	}
	$app_url = untrailingslashit( esc_url_raw( $o['app_url'] ? $o['app_url'] : MOO_CHAT_DEFAULT_APP_URL ) );
	$src     = $app_url . '/embed.js';
	$key     = esc_attr( $o['public_key'] );
	// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- third-party loader with data attr.
	printf(
		'<script src="%s" data-key="%s" async></script>' . "\n",
		esc_url( $src ),
		$key
	);
}
add_action( 'wp_footer', 'moo_chat_enqueue', 99 );

/**
 * Admin settings page.
 */
function moo_chat_admin_menu() {
	add_options_page( 'ChatMOO', 'ChatMOO', 'manage_options', 'moo-chat', 'moo_chat_settings_page' );
}
add_action( 'admin_menu', 'moo_chat_admin_menu' );

function moo_chat_register_settings() {
	register_setting(
		'moo_chat_group',
		'moo_chat_options',
		array( 'sanitize_callback' => 'moo_chat_sanitize' )
	);
}
add_action( 'admin_init', 'moo_chat_register_settings' );

function moo_chat_sanitize( $input ) {
	return array(
		'public_key' => isset( $input['public_key'] ) ? sanitize_text_field( $input['public_key'] ) : '',
		'app_url'    => isset( $input['app_url'] ) && $input['app_url'] ? esc_url_raw( $input['app_url'] ) : MOO_CHAT_DEFAULT_APP_URL,
		'enabled'    => empty( $input['enabled'] ) ? 0 : 1,
	);
}

function moo_chat_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$o = moo_chat_get_options();
	?>
	<div class="wrap">
		<h1>ChatMOO</h1>
		<p>Add your AI assistant to this site. Find your <strong>public key</strong> in your ChatMOO dashboard under <em>Install</em>.</p>
		<form method="post" action="options.php">
			<?php settings_fields( 'moo_chat_group' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="moo_chat_enabled">Enabled</label></th>
					<td><label><input type="checkbox" id="moo_chat_enabled" name="moo_chat_options[enabled]" value="1" <?php checked( $o['enabled'], 1 ); ?> /> Show the assistant on this site</label></td>
				</tr>
				<tr>
					<th scope="row"><label for="moo_chat_key">Public key</label></th>
					<td><input type="text" id="moo_chat_key" class="regular-text" name="moo_chat_options[public_key]" value="<?php echo esc_attr( $o['public_key'] ); ?>" placeholder="moo_xxxxxxxxxxxx" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="moo_chat_url">App URL</label></th>
					<td>
						<input type="url" id="moo_chat_url" class="regular-text" name="moo_chat_options[app_url]" value="<?php echo esc_attr( $o['app_url'] ); ?>" placeholder="<?php echo esc_attr( MOO_CHAT_DEFAULT_APP_URL ); ?>" />
						<p class="description">Leave as default unless you self-host ChatMOO.</p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

/** Settings link on the plugins screen. */
function moo_chat_action_links( $links ) {
	$links[] = '<a href="' . esc_url( admin_url( 'options-general.php?page=moo-chat' ) ) . '">Settings</a>';
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'moo_chat_action_links' );

<?php
/**
 * ChatMOO provisioning module for WHMCS.
 *
 * Sells & manages ChatMOO accounts from WHMCS: creates an account on order,
 * suspends/unsuspends on (non)payment, terminates on cancel, switches plan on
 * upgrade/downgrade, and gives clients one-click single sign-on into their
 * ChatMOO dashboard.
 *
 * It talks to the ChatMOO Provisioning API (POST <app>/api/provisioning),
 * authenticated with your PROVISIONING_API_KEY.
 *
 * Install: copy this folder to  <whmcs>/modules/servers/chatmoo/
 * See README.md for full setup.
 */

if (!defined('WHMCS')) {
    die('This file cannot be accessed directly');
}

use WHMCS\Database\Capsule;

/** Module metadata. */
function chatmoo_MetaData()
{
    return array(
        'DisplayName' => 'ChatMOO',
        'APIVersion' => '1.1',
        'RequiresServer' => true,
    );
}

/**
 * Product config options. configoption1 = the ChatMOO plan id this WHMCS
 * product maps to.
 */
function chatmoo_ConfigOptions()
{
    return array(
        'Plan' => array(
            'Type' => 'dropdown',
            'Options' => array(
                'free' => 'Free',
                'starter' => 'Starter',
                'pro' => 'Growth',
                'business' => 'Business',
                'custom' => 'Custom',
            ),
            'Default' => 'starter',
            'Description' => 'ChatMOO plan to provision for this product.',
        ),
    );
}

// ─────────────────────────────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────────────────────────────

function chatmoo_CreateAccount(array $params)
{
    try {
        $client = $params['clientsdetails'];
        $name = trim($client['firstname'] . ' ' . $client['lastname']);
        $business = $client['companyname'] !== '' ? $client['companyname'] : ($params['domain'] ?: $name);

        $res = chatmoo_apiCall($params, 'create', array(
            'email' => $client['email'],
            'password' => $params['password'],
            'name' => $name,
            'businessName' => $business,
            'websiteUrl' => $params['domain'],
            'plan' => $params['configoption1'],
        ));

        if (empty($res['ok'])) {
            return 'ChatMOO: ' . chatmoo_err($res);
        }

        // Remember the ChatMOO tenant id so later actions can target it.
        chatmoo_setTenantId($params, $res['tenantId'], isset($res['publicKey']) ? $res['publicKey'] : '');

        return 'success';
    } catch (\Throwable $e) {
        logModuleCall('chatmoo', 'CreateAccount', $params, $e->getMessage(), $e->getTraceAsString());
        return $e->getMessage();
    }
}

function chatmoo_SuspendAccount(array $params)
{
    return chatmoo_simpleAction($params, 'suspend', 'SuspendAccount');
}

function chatmoo_UnsuspendAccount(array $params)
{
    return chatmoo_simpleAction($params, 'unsuspend', 'UnsuspendAccount');
}

function chatmoo_TerminateAccount(array $params)
{
    return chatmoo_simpleAction($params, 'terminate', 'TerminateAccount');
}

/** Upgrade / downgrade: push the new plan to ChatMOO. */
function chatmoo_ChangePackage(array $params)
{
    try {
        $tenantId = chatmoo_getTenantId($params);
        if (!$tenantId) {
            return 'ChatMOO: no linked tenant (was the account created by this module?)';
        }
        $res = chatmoo_apiCall($params, 'change_plan', array(
            'tenantId' => $tenantId,
            'plan' => $params['configoption1'],
        ));
        return empty($res['ok']) ? 'ChatMOO: ' . chatmoo_err($res) : 'success';
    } catch (\Throwable $e) {
        logModuleCall('chatmoo', 'ChangePackage', $params, $e->getMessage(), $e->getTraceAsString());
        return $e->getMessage();
    }
}

// ─────────────────────────────────────────────────────────────────────
// Single sign-on (client clicks "Login to ChatMOO" in the client area)
// ─────────────────────────────────────────────────────────────────────

function chatmoo_ServiceSingleSignOn(array $params)
{
    try {
        $tenantId = chatmoo_getTenantId($params);
        if (!$tenantId) {
            return array('success' => false, 'errorMsg' => 'No ChatMOO tenant is linked to this service.');
        }
        $res = chatmoo_apiCall($params, 'sso', array('tenantId' => $tenantId));
        if (empty($res['ok']) || empty($res['url'])) {
            return array('success' => false, 'errorMsg' => chatmoo_err($res));
        }
        return array('success' => true, 'redirectTo' => $res['url']);
    } catch (\Throwable $e) {
        logModuleCall('chatmoo', 'ServiceSingleSignOn', $params, $e->getMessage(), $e->getTraceAsString());
        return array('success' => false, 'errorMsg' => $e->getMessage());
    }
}

/** "Test Connection" button on the server config page. */
function chatmoo_TestConnection(array $params)
{
    try {
        // A bogus tenant id: 404 (tenant_not_found) means we reached the API and
        // authenticated; 401 (unauthorized) means the key is wrong.
        $res = chatmoo_apiCall($params, 'sso', array('tenantId' => '__whmcs_connection_test__'));
        $err = isset($res['error']) ? $res['error'] : '';
        if ($err === 'unauthorized') {
            return array('success' => false, 'error' => 'Authentication failed — check the API key (server password).');
        }
        if (strpos($err, 'not configured') !== false) {
            return array('success' => false, 'error' => $err);
        }
        return array('success' => true, 'error' => '');
    } catch (\Throwable $e) {
        return array('success' => false, 'error' => $e->getMessage());
    }
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function chatmoo_simpleAction(array $params, $action, $logName)
{
    try {
        $tenantId = chatmoo_getTenantId($params);
        if (!$tenantId) {
            return 'ChatMOO: no linked tenant (was the account created by this module?)';
        }
        $res = chatmoo_apiCall($params, $action, array('tenantId' => $tenantId));
        // Terminating an already-gone tenant should not block WHMCS.
        if (empty($res['ok']) && isset($res['error']) && $res['error'] === 'tenant_not_found') {
            return 'success';
        }
        return empty($res['ok']) ? 'ChatMOO: ' . chatmoo_err($res) : 'success';
    } catch (\Throwable $e) {
        logModuleCall('chatmoo', $logName, $params, $e->getMessage(), $e->getTraceAsString());
        return $e->getMessage();
    }
}

/** POST an action to the ChatMOO provisioning API and return the decoded JSON. */
function chatmoo_apiCall(array $params, $action, array $payload = array())
{
    $base = isset($params['serverhostname']) ? trim($params['serverhostname']) : '';
    $base = rtrim($base, '/');
    if ($base !== '' && !preg_match('#^https?://#i', $base)) {
        $scheme = !empty($params['serversecure']) ? 'https://' : 'https://'; // default to https
        $base = $scheme . $base;
    }
    if ($base === '') {
        return array('ok' => false, 'error' => 'No API base URL set on the server (hostname).');
    }

    $url = $base . '/api/provisioning';
    // API key: prefer the server "Access Hash", fall back to "Password".
    $apiKey = !empty($params['serveraccesshash']) ? $params['serveraccesshash'] : (isset($params['serverpassword']) ? $params['serverpassword'] : '');

    $body = json_encode(array_merge(array('action' => $action), $payload));

    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            'Accept: application/json',
            'Authorization: Bearer ' . $apiKey,
        ),
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 15,
    ));
    $raw = curl_exec($ch);
    $curlErr = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Log every call for troubleshooting (key is in $params, WHMCS masks it).
    logModuleCall('chatmoo', 'api:' . $action, $body, $raw !== false ? $raw : $curlErr);

    if ($raw === false) {
        return array('ok' => false, 'error' => 'Connection error: ' . $curlErr);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return array('ok' => false, 'error' => 'Invalid response (HTTP ' . $httpCode . '): ' . substr($raw, 0, 200));
    }
    return $data;
}

function chatmoo_err($res)
{
    return isset($res['error']) && $res['error'] !== '' ? $res['error'] : 'unknown error';
}

/** Persist the ChatMOO tenant id (and public key) against the WHMCS service. */
function chatmoo_setTenantId(array $params, $tenantId, $publicKey = '')
{
    // Preferred: WHMCS service properties (WHMCS 7.7+).
    try {
        if (isset($params['model']) && method_exists($params['model'], 'serviceProperties')) {
            $params['model']->serviceProperties->save(array(
                'Tenant ID' => $tenantId,
                'Public Key' => $publicKey,
            ));
            return;
        }
    } catch (\Throwable $e) {
        // fall through to the username fallback
    }
    // Fallback: store the tenant id in the service's username column.
    try {
        Capsule::table('tblhosting')->where('id', $params['serviceid'])->update(array('username' => $tenantId));
    } catch (\Throwable $e) {
        logModuleCall('chatmoo', 'setTenantId', $params['serviceid'], $e->getMessage());
    }
}

/** Read back the ChatMOO tenant id for this WHMCS service. */
function chatmoo_getTenantId(array $params)
{
    try {
        if (isset($params['model']) && method_exists($params['model'], 'serviceProperties')) {
            $v = $params['model']->serviceProperties->get('Tenant ID');
            if (!empty($v)) {
                return $v;
            }
        }
    } catch (\Throwable $e) {
        // fall through
    }
    if (!empty($params['username'])) {
        return $params['username'];
    }
    return '';
}

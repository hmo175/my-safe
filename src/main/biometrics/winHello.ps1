# Windows Hello Native Biometric Bridge
param (
    [string]$Action = "check",
    [string]$Prompt = "My Safe - Authentication"
)

try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    [Windows.Security.Credentials.UI.UserConsentVerifier, Windows.Security.Credentials.UI, ContentType = WindowsRuntime] | Out-Null
    [Windows.Security.Credentials.UI.UserConsentVerificationResult, Windows.Security.Credentials.UI, ContentType = WindowsRuntime] | Out-Null
    [Windows.Security.Credentials.UI.UserConsentVerifierAvailability, Windows.Security.Credentials.UI, ContentType = WindowsRuntime] | Out-Null

    $methods = [System.WindowsRuntimeSystemExtensions].GetMethods()
    $asTaskMethod = $null
    foreach ($m in $methods) {
        if ($m.Name -eq 'AsTask' -and $m.GetParameters().Count -eq 1) {
            $p = $m.GetParameters()[0]
            if ($p.ParameterType.Name -eq 'IAsyncOperation`1') {
                $asTaskMethod = $m
                break
            }
        }
    }

    if ($Action -eq "check") {
        $op = [Windows.Security.Credentials.UI.UserConsentVerifier]::CheckAvailabilityAsync()
        $targetType = [Windows.Security.Credentials.UI.UserConsentVerifierAvailability]
        $genericMethod = $asTaskMethod.MakeGenericMethod($targetType)
        $task = $genericMethod.Invoke($null, @($op))
        $res = $task.Result
        Write-Output "$res"
    }
    elseif ($Action -eq "verify") {
        # Foreground focus helper for Windows Hello modal
        try {
            Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public class WinHelloFocus {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    public static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);

    public static void BringPromptToFront() {
        EnumWindows((hWnd, lParam) => {
            if (!IsWindowVisible(hWnd)) return true;
            uint pid = 0;
            GetWindowThreadProcessId(hWnd, out pid);
            try {
                var proc = System.Diagnostics.Process.GetProcessById((int)pid);
                if (proc.ProcessName.IndexOf("CredentialUIBroker", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    proc.ProcessName.IndexOf("ConsentUI", StringComparison.OrdinalIgnoreCase) >= 0) {
                    SetWindowPos(hWnd, HWND_TOPMOST, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040);
                    SetForegroundWindow(hWnd);
                    BringWindowToTop(hWnd);
                    SetWindowPos(hWnd, HWND_NOTOPMOST, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040);
                    return false;
                }
            } catch {}
            return true;
        }, IntPtr.Zero);
    }
}
'@ -ErrorAction SilentlyContinue
        } catch {}

        $op = [Windows.Security.Credentials.UI.UserConsentVerifier]::RequestVerificationAsync($Prompt)
        $targetType = [Windows.Security.Credentials.UI.UserConsentVerificationResult]
        $genericMethod = $asTaskMethod.MakeGenericMethod($targetType)
        $task = $genericMethod.Invoke($null, @($op))

        # Launch watcher to elevate CredentialUIBroker / ConsentUI to foreground
        try {
            [System.Threading.Tasks.Task]::Run([Action]{
                for ($i = 0; $i -lt 35; $i++) {
                    [System.Threading.Thread]::Sleep(100)
                    [WinHelloFocus]::BringPromptToFront()
                }
            }) | Out-Null
        } catch {}

        $res = $task.Result
        Write-Output "$res"
    }
}
catch {
    Write-Output "Error: $($_.Exception.Message)"
}

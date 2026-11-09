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
        $op = [Windows.Security.Credentials.UI.UserConsentVerifier]::RequestVerificationAsync($Prompt)
        $targetType = [Windows.Security.Credentials.UI.UserConsentVerificationResult]
        $genericMethod = $asTaskMethod.MakeGenericMethod($targetType)
        $task = $genericMethod.Invoke($null, @($op))
        $res = $task.Result
        Write-Output "$res"
    }
}
catch {
    Write-Output "Error: $($_.Exception.Message)"
}

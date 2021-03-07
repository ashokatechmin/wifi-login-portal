# Unofficial Wifi Login Portal for Ashoka

## What it does

- [x] Logs you into the wifi
- [x] Automatically check for connectivity to the outside internet
- [x] Remembers your credentials so you don't type them again over and over again (please don't do this on public computers)
- [x] Logs you out without you logging into the wifi (cumulatively, I think we've all lost hours doing this)
- [x] Automatically logs you in on the hour (experimental, may not work as expected)
- [x] Lets you switch wifis with a single button (logs you out of the current one and then waits for you to connect to the new wifi, and then logs you in there. Again, we've all probably lost a lot of time dealing with this)

## Caveats

Due to something called `no-cors` mode, we cannot actually tell whether the credentials you entered were correct. So, we just assume what you enter is correct. This shouldn't be a problem at all if you're using the `remember me` option & we'll let you know whether the internet is working after your login
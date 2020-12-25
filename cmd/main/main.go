package main

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/asticode/go-astikit"
	"github.com/asticode/go-astilectron"
)

func main() {
	port := new(int)

	if len(os.Args) > 1 {
		p, err := strconv.Atoi(os.Args[1])
		if err != nil {
			println(os.Args)
			panic(err)
		}
		port = &p
	}
	// Set logger
	l := log.New(log.Writer(), log.Prefix(), log.Flags())

	// Create astilectron
	a, err := astilectron.New(l, astilectron.Options{
		AppName:           "Test",
		BaseDirectoryPath: "public",
		SkipSetup:         true,
		TCPPort:           port,
	})
	if err != nil {
		l.Fatal(fmt.Errorf("main: creating astilectron failed: %w", err))
	}
	defer a.Close()

	// Handle signals
	a.HandleSignals()

	fmt.Println("Start")
	os.Stdout.Sync()
	// Start
	if err = a.Start(); err != nil {
		l.Fatal(fmt.Errorf("main: starting astilectron failed: %w", err))
	}


	// New window
	var w *astilectron.Window
	if w, err = a.NewWindow(os.Args[2], &astilectron.WindowOptions{
		Center: astikit.BoolPtr(true),
		Height: astikit.IntPtr(600),
		Width:  astikit.IntPtr(800),
	}); err != nil {
		l.Fatal(fmt.Errorf("main: new window failed: %w", err))
	}

	// Create windows
	if err = w.Create(); err != nil {
		l.Fatal(fmt.Errorf("main: creating window failed: %w", err))
	}

	// Blocking pattern
	a.Wait()
}

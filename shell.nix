{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = with pkgs; [
    python311
    python311Packages.pip
    nodejs_20
    git
    openssl
    pkg-config
  ];

  shellHook = ''
    echo "Nix shell for aozora-rag-chat"
    echo "Python: $(python3 --version)"
    echo "Node: $(node --version)"
  '';
}

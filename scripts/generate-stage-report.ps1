param(
    [string]$SourcePath = (Join-Path $PSScriptRoot "..\docs\RAPPORT-STAGE-2026-TANIT-JOBS.md"),
    [string]$OutputPath = (Join-Path $PSScriptRoot "..\docs\Rapport_de_stage_2026_Gestion_de_Dattes_Tanit_Jobs.docx")
)

$ErrorActionPreference = "Stop"

function Convert-HexToOleColor([string]$Hex) {
    $clean = $Hex.TrimStart('#')
    $red = [Convert]::ToInt32($clean.Substring(0, 2), 16)
    $green = [Convert]::ToInt32($clean.Substring(2, 2), 16)
    $blue = [Convert]::ToInt32($clean.Substring(4, 2), 16)
    return $red + ($green * 256) + ($blue * 65536)
}

function Convert-CmToPoints([double]$Centimeters) {
    return $Centimeters * 28.3464567
}

function Clean-Inline([string]$Text) {
    $result = $Text -replace '\*\*', '' -replace '`', ''
    $result = $result -replace '\[(.*?)\]\((.*?)\)', '$1 ($2)'
    return $result.Trim()
}

$word = $null
$document = $null
$selection = $null

try {
    $source = (Resolve-Path -LiteralPath $SourcePath).Path
    $targetDirectory = Split-Path -Parent $OutputPath
    if (-not (Test-Path -LiteralPath $targetDirectory)) {
        New-Item -ItemType Directory -Path $targetDirectory | Out-Null
    }
    $target = [IO.Path]::GetFullPath($OutputPath)

    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $document = $word.Documents.Add()
    $selection = $word.Selection

    $brown = Convert-HexToOleColor "5C2D00"
    $amber = Convert-HexToOleColor "C98224"
    $cream = Convert-HexToOleColor "F7F1E7"
    $softBrown = Convert-HexToOleColor "E9D7BE"
    $dark = Convert-HexToOleColor "24180F"
    $muted = Convert-HexToOleColor "6F6258"
    $white = Convert-HexToOleColor "FFFFFF"

    foreach ($section in $document.Sections) {
        $section.PageSetup.PaperSize = 7
        $section.PageSetup.TopMargin = Convert-CmToPoints 2.2
        $section.PageSetup.BottomMargin = Convert-CmToPoints 2.0
        $section.PageSetup.LeftMargin = Convert-CmToPoints 2.5
        $section.PageSetup.RightMargin = Convert-CmToPoints 2.0
        $section.PageSetup.HeaderDistance = Convert-CmToPoints 0.9
        $section.PageSetup.FooterDistance = Convert-CmToPoints 0.9
    }

    $normal = $document.Styles.Item(-1)
    $normal.Font.Name = "Times New Roman"
    $normal.Font.Size = 12
    $normal.Font.Color = $dark
    $normal.ParagraphFormat.Alignment = 3
    $normal.ParagraphFormat.LineSpacingRule = 1
    $normal.ParagraphFormat.SpaceAfter = 6
    $normal.ParagraphFormat.FirstLineIndent = Convert-CmToPoints 0.6

    $heading1 = $document.Styles.Item(-2)
    $heading1.Font.Name = "Arial"
    $heading1.Font.Size = 17
    $heading1.Font.Bold = $true
    $heading1.Font.Color = $brown
    $heading1.ParagraphFormat.SpaceBefore = 12
    $heading1.ParagraphFormat.SpaceAfter = 10
    $heading1.ParagraphFormat.KeepWithNext = $true

    $heading2 = $document.Styles.Item(-3)
    $heading2.Font.Name = "Arial"
    $heading2.Font.Size = 14
    $heading2.Font.Bold = $true
    $heading2.Font.Color = $brown
    $heading2.ParagraphFormat.SpaceBefore = 10
    $heading2.ParagraphFormat.SpaceAfter = 6
    $heading2.ParagraphFormat.KeepWithNext = $true

    $heading3 = $document.Styles.Item(-4)
    $heading3.Font.Name = "Arial"
    $heading3.Font.Size = 12
    $heading3.Font.Bold = $true
    $heading3.Font.Color = $amber
    $heading3.ParagraphFormat.SpaceBefore = 8
    $heading3.ParagraphFormat.SpaceAfter = 4
    $heading3.ParagraphFormat.KeepWithNext = $true

    $heading4 = $document.Styles.Item(-5)
    $heading4.Font.Name = "Arial"
    $heading4.Font.Size = 11
    $heading4.Font.Bold = $true
    $heading4.Font.Color = $dark

    $captionStyle = $document.Styles.Item(-35)
    $captionStyle.Font.Name = "Times New Roman"
    $captionStyle.Font.Size = 10
    $captionStyle.Font.Italic = $true
    $captionStyle.Font.Color = $muted
    $captionStyle.ParagraphFormat.Alignment = 1
    $captionStyle.ParagraphFormat.SpaceAfter = 8

    try { $null = $document.CaptionLabels.Add("Tableau") } catch { }

    function Set-BaseParagraph {
        $selection.Style = $normal
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 12
        $selection.Font.Bold = $false
        $selection.Font.Italic = $false
        $selection.Font.Color = $dark
        $selection.ParagraphFormat.Alignment = 3
        $selection.ParagraphFormat.FirstLineIndent = Convert-CmToPoints 0.6
        $selection.ParagraphFormat.SpaceAfter = 6
        $selection.ParagraphFormat.LineSpacingRule = 1
    }

    function Add-Paragraph([string]$Text, [bool]$Bullet = $false) {
        Set-BaseParagraph
        if ($Bullet) {
            $selection.Style = $document.Styles.Item(-49)
            $selection.ParagraphFormat.FirstLineIndent = 0
            $selection.ParagraphFormat.LeftIndent = Convert-CmToPoints 0.8
        }
        $selection.TypeText((Clean-Inline $Text))
        $selection.TypeParagraph()
    }

    function Add-Heading([string]$Text, [int]$Level) {
        $styleId = switch ($Level) { 1 { -2 } 2 { -3 } 3 { -4 } default { -5 } }
        $selection.Style = $document.Styles.Item($styleId)
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.TypeText((Clean-Inline $Text))
        $selection.TypeParagraph()
    }

    function Add-Caption([string]$Label, [string]$Title, [int]$Position) {
        $selection.Style = $captionStyle
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.InsertCaption($Label, " — $Title", "", $Position, $false)
        $selection.TypeParagraph()
    }

    function Add-FigurePlaceholder([string]$Title, [string]$Hint) {
        $range = $selection.Range
        $table = $document.Tables.Add($range, 1, 1)
        $table.AllowAutoFit = $false
        $table.PreferredWidthType = 2
        $table.PreferredWidth = 100
        $table.Rows.HeightRule = 2
        $table.Rows.Height = Convert-CmToPoints 6.3
        $table.Borders.Enable = 1
        $table.Borders.OutsideColor = $amber
        $table.Borders.InsideColor = $amber
        $cell = $table.Cell(1, 1)
        $cell.Shading.BackgroundPatternColor = $cream
        $cell.VerticalAlignment = 1
        $cell.Range.ParagraphFormat.Alignment = 1
        $cell.Range.ParagraphFormat.SpaceAfter = 6
        $cell.Range.Font.Name = "Arial"
        $cell.Range.Font.Size = 13
        $cell.Range.Font.Bold = $true
        $cell.Range.Font.Color = $brown
        $cell.Range.Text = "EMPLACEMENT À COMPLÉTER`r`n`r`n$Title`r`n`r`n$Hint"
        $cell.Range.Paragraphs.Item(1).Range.Font.Size = 10
        $cell.Range.Paragraphs.Item(1).Range.Font.Color = $amber

        $selection.SetRange($table.Range.End, $table.Range.End)
        $selection.TypeParagraph()
        Add-Caption "Figure" $Title 1
    }

    function Add-MarkdownTable([string[]]$TableLines, [string]$Caption) {
        $dataLines = @($TableLines | Where-Object { $_ -notmatch '^\s*\|?\s*:?-{3,}' })
        if ($dataLines.Count -eq 0) { return }
        $rows = @()
        foreach ($line in $dataLines) {
            $trimmed = $line.Trim().Trim('|')
            $rows += ,@($trimmed.Split('|') | ForEach-Object { Clean-Inline $_ })
        }
        $columnCount = ($rows | ForEach-Object Count | Measure-Object -Maximum).Maximum
        if ($columnCount -lt 1) { return }

        Add-Caption "Tableau" $Caption 0
        $range = $selection.Range
        $table = $document.Tables.Add($range, $rows.Count, $columnCount)
        $table.Borders.Enable = 1
        $table.AllowAutoFit = $true
        $table.Range.Font.Name = "Times New Roman"
        $table.Range.Font.Size = 9.5
        $table.Range.ParagraphFormat.SpaceAfter = 2
        $table.Range.ParagraphFormat.FirstLineIndent = 0

        for ($rowIndex = 0; $rowIndex -lt $rows.Count; $rowIndex++) {
            for ($columnIndex = 0; $columnIndex -lt $columnCount; $columnIndex++) {
                $value = if ($columnIndex -lt $rows[$rowIndex].Count) { $rows[$rowIndex][$columnIndex] } else { "" }
                $cell = $table.Cell($rowIndex + 1, $columnIndex + 1)
                $cell.Range.Text = $value
                $cell.VerticalAlignment = 1
                if ($rowIndex -eq 0) {
                    $cell.Shading.BackgroundPatternColor = $brown
                    $cell.Range.Font.Color = $white
                    $cell.Range.Font.Bold = $true
                } elseif ($rowIndex % 2 -eq 0) {
                    $cell.Shading.BackgroundPatternColor = $cream
                }
            }
        }
        $selection.SetRange($table.Range.End, $table.Range.End)
        $selection.TypeParagraph()
        $selection.TypeParagraph()
    }

    # Page de garde
    $logoTable = $document.Tables.Add($selection.Range, 1, 2)
    $logoTable.Borders.Enable = 0
    $logoTable.PreferredWidthType = 2
    $logoTable.PreferredWidth = 100
    foreach ($index in 1..2) {
        $logoTable.Cell(1, $index).VerticalAlignment = 1
        $logoTable.Cell(1, $index).Range.ParagraphFormat.Alignment = 1
        $logoTable.Cell(1, $index).Range.Font.Name = "Arial"
        $logoTable.Cell(1, $index).Range.Font.Size = 11
        $logoTable.Cell(1, $index).Range.Font.Bold = $true
        $logoTable.Cell(1, $index).Shading.BackgroundPatternColor = $cream
    }
    $logoTable.Cell(1, 1).Range.Text = "[LOGO ESPRIT]`r`nÉcole Supérieure Privée d’Ingénierie et de Technologies"
    $logoTable.Cell(1, 2).Range.Text = "[LOGO TANIT JOBS]`r`nEntreprise d’accueil"
    $selection.SetRange($logoTable.Range.End, $logoTable.Range.End)
    $selection.TypeParagraph()
    $selection.TypeParagraph()

    $selection.ParagraphFormat.Alignment = 1
    $selection.ParagraphFormat.FirstLineIndent = 0
    $selection.Font.Name = "Arial"
    $selection.Font.Size = 17
    $selection.Font.Bold = $true
    $selection.Font.Color = $brown
    $selection.TypeText("RAPPORT DE STAGE D’IMMERSION EN ENTREPRISE")
    $selection.TypeParagraph()
    $selection.TypeParagraph()

    $selection.Font.Size = 13
    $selection.Font.Color = $muted
    $selection.TypeText("Année universitaire 2026–2027")
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    $selection.TypeParagraph()

    $selection.Font.Name = "Arial"
    $selection.Font.Size = 25
    $selection.Font.Bold = $true
    $selection.Font.Color = $dark
    $selection.TypeText("Conception et développement d’une application web de gestion de dattes")
    $selection.TypeParagraph()
    $selection.TypeParagraph()

    $selection.Font.Size = 15
    $selection.Font.Color = $amber
    $selection.TypeText("Application « Gestion de Dattes »")
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    $selection.TypeParagraph()

    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 12
    $selection.Font.Bold = $false
    $selection.Font.Color = $dark
    $selection.TypeText("Réalisé par : Ahmed Dhib")
    $selection.TypeParagraph()
    $selection.TypeText("Classe : 3A63 — à confirmer")
    $selection.TypeParagraph()
    $selection.TypeText("Entreprise d’accueil : Tanit Jobs")
    $selection.TypeParagraph()
    $selection.TypeText("Encadrant professionnel : [Nom et fonction]")
    $selection.TypeParagraph()
    $selection.TypeText("Encadrant académique : [Nom et fonction]")
    $selection.TypeParagraph()
    $selection.TypeText("Période du stage : [JJ/MM/2026 – JJ/MM/2026]")
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    $selection.TypeParagraph()

    $selection.Font.Name = "Arial"
    $selection.Font.Size = 11
    $selection.Font.Bold = $true
    $selection.Font.Color = $brown
    $selection.TypeText("ESPRIT — 2026")

    # Nouvelle section : la couverture ne porte pas de numéro de page.
    $selection.InsertBreak(2)
    $document.Sections.Item(1).PageSetup.DifferentFirstPageHeaderFooter = $true
    $section = $document.Sections.Item(2)
    $section.PageSetup.PaperSize = 7
    $section.PageSetup.TopMargin = Convert-CmToPoints 2.2
    $section.PageSetup.BottomMargin = Convert-CmToPoints 2.0
    $section.PageSetup.LeftMargin = Convert-CmToPoints 2.5
    $section.PageSetup.RightMargin = Convert-CmToPoints 2.0
    $section.Headers.Item(1).LinkToPrevious = $false
    $section.Footers.Item(1).LinkToPrevious = $false
    $section.Headers.Item(1).Range.Text = "Rapport de stage 2026  •  Gestion de Dattes  •  Tanit Jobs"
    $section.Headers.Item(1).Range.Font.Name = "Arial"
    $section.Headers.Item(1).Range.Font.Size = 8.5
    $section.Headers.Item(1).Range.Font.Color = $muted
    $section.Headers.Item(1).Range.ParagraphFormat.Alignment = 1
    $section.Footers.Item(1).PageNumbers.RestartNumberingAtSection = $true
    $section.Footers.Item(1).PageNumbers.StartingNumber = 1
    $null = $section.Footers.Item(1).PageNumbers.Add(1, $true)

    $lines = Get-Content -LiteralPath $source -Encoding UTF8
    $lastHeading = "Tableau de synthèse"
    $index = 0

    while ($index -lt $lines.Count) {
        $line = $lines[$index]

        if ($line -eq "---PAGEBREAK---") {
            $selection.InsertBreak(7)
            $index++
            continue
        }
        if ($line -eq "[SUMMARY]") {
            $selection.ParagraphFormat.FirstLineIndent = 0
            $field = $document.Fields.Add($selection.Range, 13, '\o "1-1" \h \z \u', $true)
            $selection.SetRange($field.Result.End, $field.Result.End)
            $selection.TypeParagraph()
            $index++
            continue
        }
        if ($line -eq "[TOC]") {
            $selection.ParagraphFormat.FirstLineIndent = 0
            $field = $document.Fields.Add($selection.Range, 13, '\o "1-3" \h \z \u', $true)
            $selection.SetRange($field.Result.End, $field.Result.End)
            $selection.TypeParagraph()
            $index++
            continue
        }
        if ($line -eq "[LIST_FIGURES]") {
            $selection.ParagraphFormat.FirstLineIndent = 0
            $field = $document.Fields.Add($selection.Range, 13, '\h \z \c "Figure"', $true)
            $selection.SetRange($field.Result.End, $field.Result.End)
            $selection.TypeParagraph()
            $index++
            continue
        }
        if ($line -eq "[LIST_TABLES]") {
            $selection.ParagraphFormat.FirstLineIndent = 0
            $field = $document.Fields.Add($selection.Range, 13, '\h \z \c "Tableau"', $true)
            $selection.SetRange($field.Result.End, $field.Result.End)
            $selection.TypeParagraph()
            $index++
            continue
        }
        if ($line -match '^\[FIGURE:\s*(.*?)\s*\|\s*(.*?)\]$') {
            Add-FigurePlaceholder $matches[1].Trim() $matches[2].Trim()
            $index++
            continue
        }
        if ($line -match '^\|') {
            $tableLines = [System.Collections.Generic.List[string]]::new()
            while ($index -lt $lines.Count -and $lines[$index] -match '^\|') {
                $tableLines.Add($lines[$index])
                $index++
            }
            Add-MarkdownTable $tableLines.ToArray() $lastHeading
            continue
        }
        if ($line -match '^(#{1,4})\s+(.+)$') {
            $level = $matches[1].Length
            $title = $matches[2]
            Add-Heading $title $level
            $lastHeading = Clean-Inline $title
            $index++
            continue
        }
        if ($line -match '^[-*]\s+(.+)$') {
            Add-Paragraph $matches[1] $true
            $index++
            continue
        }
        if ($line -match '^\d+\.\s+(.+)$') {
            Add-Paragraph $line $false
            $index++
            continue
        }
        if (-not [string]::IsNullOrWhiteSpace($line)) {
            Add-Paragraph $line $false
        }
        $index++
    }

    $document.Repaginate()
    foreach ($field in $document.Fields) {
        try { $null = $field.Update() } catch { }
    }
    foreach ($toc in $document.TablesOfContents) {
        try { $toc.Update() } catch { }
    }

    # Les propriétés Office ne sont pas toutes exposées de la même manière
    # selon la langue et l'installation de Word. Elles enrichissent le fichier,
    # mais ne doivent jamais empêcher sa génération.
    try {
        $document.BuiltInDocumentProperties.Item("Title").Value = "Rapport de stage 2026 — Gestion de Dattes"
        $document.BuiltInDocumentProperties.Item("Subject").Value = "Conception et développement d’une application web de gestion de dattes"
        $document.BuiltInDocumentProperties.Item("Author").Value = "Ahmed Dhib"
        $document.BuiltInDocumentProperties.Item("Company").Value = "Tanit Jobs"
        $document.BuiltInDocumentProperties.Item("Keywords").Value = "Next.js, TypeScript, Prisma, PostgreSQL, gestion de dattes, ERP"
    } catch { }

    $document.SaveAs2($target, 16)
    $document.Close($false)

    # Une réouverture est nécessaire pour que Word indexe aussi les légendes
    # créées après les champs de listes (notamment les tableaux). On met d'abord
    # à jour les séquences, puis les quatre tables automatiques.
    $document = $word.Documents.Open($target)
    foreach ($field in $document.Fields) {
        if ($field.Type -ne 13) {
            try { $null = $field.Update() } catch { }
        }
    }
    $document.Repaginate()
    foreach ($field in $document.Fields) {
        if ($field.Type -eq 13) {
            try { $null = $field.Update() } catch { }
        }
    }
    $document.Repaginate()
    $document.Save()
    $document.Close($false)
    $document = $null
    $word.Quit()
    $word = $null

    Write-Output "Rapport Word généré : $target"
}
finally {
    if ($document -ne $null) {
        try { $document.Close($false) } catch { }
    }
    if ($word -ne $null) {
        try { $word.Quit() } catch { }
    }
    if ($selection -ne $null) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($selection) }
    if ($document -ne $null) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($document) }
    if ($word -ne $null) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word) }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

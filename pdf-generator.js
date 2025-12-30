function generatePDFReport(getActiveAccount, currencySymbols) {
    try {
        var account = getActiveAccount();
        var data = JSON.parse(localStorage.getItem('tradingDB') || '{}');
        var history = JSON.parse(localStorage.getItem('tradeHistory') || '[]');
        var currency = data.currency || 'USD';
        var symbol = currencySymbols[currency] || '$';
        
        var initialBalance = parseFloat(data.balance) || 0;
        var currentBalance = parseFloat(data.currentBalance) || initialBalance;
        var targetProfit = parseFloat(data.profit) || 0;
        var consistencyRule = parseFloat(data.consistency) || 0;
        var dailyLossPercent = parseFloat(data.dailyloss) || 0;
        var maxLossPercent = parseFloat(data.maxloss) || 0;
        var riskPercent = parseFloat(data.risk) || 0;
        var dailyLossSystem = data['dailyloss-system'] || 'floating';
        var maxLossSystem = data['maxloss-system'] || 'floating';
        
        var totalProfit = 0;
        var totalLoss = 0;
        var todayStr = new Date().toDateString();
        var todayLoss = 0;
        var highestProfit = 0;
        
        for (var i = 0; i < history.length; i++) {
            var item = history[i];
            var amt = parseFloat(item.amount) || 0;
            if (item.type === 'profit') {
                totalProfit += amt;
                if (amt > highestProfit) highestProfit = amt;
            } else {
                totalLoss += amt;
                if (new Date(item.date).toDateString() === todayStr) {
                    todayLoss += amt;
                }
            }
        }
        
        var dailyLossBase = dailyLossSystem === 'flat' ? initialBalance : (currentBalance + todayLoss);
        var maxLossBase = maxLossSystem === 'flat' ? initialBalance : (currentBalance + totalLoss);
        var dailyLossLimit = (dailyLossPercent / 100) * dailyLossBase;
        var maxLossLimit = (maxLossPercent / 100) * maxLossBase;
        var dailyRemaining = dailyLossLimit - todayLoss;
        var maxRemaining = maxLossLimit - totalLoss;
        var netProfit = totalProfit - totalLoss;
        var profitFactor = totalLoss > 0 ? (totalProfit / totalLoss) : (totalProfit > 0 ? totalProfit : 0);
        var currentProfitPercent = initialBalance > 0 ? ((currentBalance - initialBalance) / initialBalance) * 100 : 0;
        var consistencyPercent = netProfit > 0 ? (highestProfit / netProfit) * 100 : 0;
        
        var now = new Date();
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        var monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var reportDate = months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
        var hours = now.getHours();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        var minutes = now.getMinutes().toString().padStart(2, '0');
        var timeStr = hours + ':' + minutes + ' ' + ampm;
        
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF('p', 'mm', 'a4');
        var pageWidth = doc.internal.pageSize.getWidth();
        var margin = 25.4; // 2.54 cm
        var contentWidth = pageWidth - margin * 2;
        var yPos = margin;
        
        // Colors
        var black = [0, 0, 0];
        var maroon = [139, 0, 0];
        var gray = [85, 85, 85];
        var lightGray = [136, 136, 136];
        var red = [220, 38, 38];
        
        // ===== HEADER =====
        doc.setTextColor(black[0], black[1], black[2]);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('beTrader', margin, yPos);
        
        yPos += 6;
        doc.setFontSize(12);
        doc.setTextColor(maroon[0], maroon[1], maroon[2]);
        doc.text('TRADING JOURNAL REPORT', margin, yPos);
        
        yPos += 5;
        doc.setFontSize(8);
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.setFont('helvetica', 'normal');
        doc.text('Performance Summary and Trade History', margin, yPos);
        
        yPos += 3;
        doc.setDrawColor(black[0], black[1], black[2]);
        doc.setLineWidth(0.13);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        
        yPos += 8;
        
        // ===== ACCOUNT INFO =====
        doc.setFontSize(8);
        var infoItems = [
            ['Account Name', account ? account.name : 'Account'],
            ['Currency', currency + ' (' + symbol + ')'],
            ['Report Generated', reportDate]
        ];
        
        for (var i = 0; i < infoItems.length; i++) {
            doc.setTextColor(gray[0], gray[1], gray[2]);
            doc.setFont('helvetica', 'normal');
            doc.text(infoItems[i][0], margin, yPos);
            doc.setTextColor(black[0], black[1], black[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(infoItems[i][1], pageWidth - margin, yPos, { align: 'right' });
            yPos += 5;
        }
        
        yPos += 5;
        
        // ===== ACCOUNT SUMMARY =====
        doc.setTextColor(black[0], black[1], black[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('ACCOUNT SUMMARY', margin, yPos);
        yPos += 2;
        doc.setLineWidth(0.13);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        
        yPos += 10;
        
        // Balance Cards
        var cardWidth = contentWidth / 4;
        var cards = [
            [symbol + initialBalance.toLocaleString(), 'INITIAL BALANCE'],
            [symbol + currentBalance.toLocaleString(), 'CURRENT BALANCE'],
            [(netProfit >= 0 ? '+' : '-') + symbol + Math.abs(netProfit).toLocaleString(), 'TOTAL P/L'],
            [(currentProfitPercent >= 0 ? '+' : '') + currentProfitPercent.toFixed(2) + '%', 'RETURN']
        ];
        
        for (var i = 0; i < cards.length; i++) {
            var cardX = margin + (i * cardWidth) + (cardWidth / 2);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(black[0], black[1], black[2]);
            doc.text(cards[i][0], cardX, yPos, { align: 'center' });
            doc.setFontSize(6);
            doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
            doc.text(cards[i][1], cardX, yPos + 5, { align: 'center' });
        }
        
        yPos += 15;
        
        // ===== STATISTICS & LIMITS =====
        var col1X = margin;
        var col2X = margin + contentWidth / 2 + 10;
        var startY = yPos;
        
        // Statistics column
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(black[0], black[1], black[2]);
        doc.text('STATISTICS', col1X, yPos);
        yPos += 2;
        doc.setLineWidth(0.13);
        doc.line(col1X, yPos, col1X + contentWidth / 2 - 15, yPos);
        yPos += 6;
        
        var statsItems = [
            ['Total Profit', '+' + symbol + totalProfit.toFixed(2), black],
            ['Total Loss', '-' + symbol + totalLoss.toFixed(2), red],
            ['Net Profit', (netProfit >= 0 ? '+' : '-') + symbol + Math.abs(netProfit).toFixed(2), netProfit >= 0 ? black : red],
            ['Profit Factor', profitFactor.toFixed(2), black],
            ['Total Trading', history.length.toString(), black],
            ['Target Profit', currentProfitPercent.toFixed(2) + '% / ' + targetProfit + '%', black],
            ['Consistency', consistencyPercent.toFixed(2) + '% / ' + consistencyRule + '%', black]
        ];
        
        doc.setFontSize(8);
        for (var i = 0; i < statsItems.length; i++) {
            doc.setTextColor(gray[0], gray[1], gray[2]);
            doc.setFont('helvetica', 'normal');
            doc.text(statsItems[i][0], col1X, yPos);
            doc.setTextColor(statsItems[i][2][0], statsItems[i][2][1], statsItems[i][2][2]);
            doc.setFont('helvetica', 'bold');
            doc.text(statsItems[i][1], col1X + contentWidth / 2 - 20, yPos, { align: 'right' });
            yPos += 5;
        }
        
        // Limits column
        yPos = startY;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(black[0], black[1], black[2]);
        doc.text('LIMITS', col2X, yPos);
        yPos += 2;
        doc.setLineWidth(0.13);
        doc.line(col2X, yPos, pageWidth - margin, yPos);
        yPos += 6;
        
        var limitsItems = [
            ['Max Loss', symbol + totalLoss.toFixed(2) + ' / ' + symbol + maxRemaining.toFixed(2)],
            ['Daily Loss', symbol + todayLoss.toFixed(2) + ' / ' + symbol + dailyRemaining.toFixed(2)],
            ['Risk Trading', riskPercent + '%']
        ];
        
        for (var i = 0; i < limitsItems.length; i++) {
            doc.setTextColor(gray[0], gray[1], gray[2]);
            doc.setFont('helvetica', 'normal');
            doc.text(limitsItems[i][0], col2X, yPos);
            doc.setTextColor(black[0], black[1], black[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(limitsItems[i][1], pageWidth - margin, yPos, { align: 'right' });
            yPos += 5;
        }
        
        yPos = startY + 45;
        
        // ===== TRADING HISTORY =====
        doc.setTextColor(black[0], black[1], black[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('TRADING HISTORY', margin, yPos);
        yPos += 2;
        doc.setLineWidth(0.13);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        
        yPos += 4;
        
        // Table header
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(gray[0], gray[1], gray[2]);
        var colNo = margin;
        var colDate = margin + 12;
        var colType = margin + 45;
        var colAmount = margin + 70;
        var colBalance = margin + 105;
        var colResult = margin + 140;
        
        doc.text('No', colNo, yPos);
        doc.text('Date', colDate, yPos);
        doc.text('Type', colType, yPos);
        doc.text('Amount', colAmount, yPos);
        doc.text('Balance', colBalance, yPos);
        doc.text('Result', colResult, yPos);
        
        yPos += 4;
        doc.setLineWidth(0.13);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        
        // Table rows
        doc.setFont('helvetica', 'normal');
        if (history.length > 0) {
            for (var i = 0; i < history.length && yPos < 260; i++) {
                var item = history[i];
                var itemDate = new Date(item.date);
                var dateFormatted = monthsShort[itemDate.getMonth()] + ' ' + itemDate.getDate() + ', ' + itemDate.getFullYear();
                var isProfit = item.type === 'profit';
                var amt = parseFloat(item.amount) || 0;
                var bal = parseFloat(item.balance) || 0;
                
                doc.setTextColor(black[0], black[1], black[2]);
                doc.text(String(i + 1), colNo, yPos);
                doc.text(dateFormatted, colDate, yPos);
                
                if (isProfit) {
                    doc.text('Profit', colType, yPos);
                    doc.text('+' + symbol + amt.toFixed(2), colAmount, yPos);
                    doc.text(symbol + bal.toFixed(2), colBalance, yPos);
                    doc.text('Win', colResult, yPos);
                } else {
                    doc.setTextColor(red[0], red[1], red[2]);
                    doc.text('Loss', colType, yPos);
                    doc.text('-' + symbol + amt.toFixed(2), colAmount, yPos);
                    doc.setTextColor(black[0], black[1], black[2]);
                    doc.text(symbol + bal.toFixed(2), colBalance, yPos);
                    doc.setTextColor(red[0], red[1], red[2]);
                    doc.text('Loss', colResult, yPos);
                }
                
                yPos += 5;
            }
            
            // Net Total row
            yPos += 2;
            doc.setLineWidth(0.13);
            doc.setDrawColor(black[0], black[1], black[2]);
            doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);
            
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(black[0], black[1], black[2]);
            doc.text('Net Total:', colType, yPos);
            if (netProfit >= 0) {
                doc.text('+' + symbol + netProfit.toFixed(2), colAmount, yPos);
            } else {
                doc.setTextColor(red[0], red[1], red[2]);
                doc.text('-' + symbol + Math.abs(netProfit).toFixed(2), colAmount, yPos);
            }
        } else {
            doc.setTextColor(gray[0], gray[1], gray[2]);
            doc.text('No trading history available', margin, yPos);
        }
        
        // ===== FOOTER =====
        doc.setFontSize(7);
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.setFont('helvetica', 'normal');
        doc.text('Generated by beTrader Trading Journal App | ' + reportDate + ' at ' + timeStr, pageWidth / 2, 285, { align: 'center' });
        
        var fileName = 'Trading_Report_' + now.toISOString().slice(0, 10) + '.pdf';

        
        // Universal blob download method
        var pdfBlob = doc.output('blob');
        var blobUrl = URL.createObjectURL(pdfBlob);
        var link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(function() {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        }, 100);
        
    } catch(e) {
        alert('Error generating PDF: ' + e.message);
        console.error(e);
    }
}
